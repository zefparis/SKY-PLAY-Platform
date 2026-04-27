'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { VoiceUser } from '@/types/voice'
import { useCallRingtone } from './useCallRingtone'
import { useSoundNotification } from './useSoundNotification'
import { useAuthStore } from '@/lib/auth-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

// Fallback ICE servers used when /chat/ice-servers is unreachable.
// OpenRelay is a public shared TURN — unreliable in prod but fine for dev.
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]

type UseVoiceChatProps = {
  socket: Socket | null
  isConnected: boolean
}

type IncomingCall = {
  fromUserId: string
  fromUsername: string
  fromAvatar?: string
  voiceRoom: string
}

export function useVoiceChat({ socket, isConnected }: UseVoiceChatProps) {
  const [isInVoice, setIsInVoice] = useState(false)
  const [currentVoiceRoom, setCurrentVoiceRoom] = useState<string | null>(null)
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [voiceChannelCounts, setVoiceChannelCounts] = useState<Record<string, number>>({})
  const [callingUser, setCallingUser] = useState<{ targetUserId: string; targetUsername: string; voiceRoom: string } | null>(null)
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const retryCountRef = useRef<Map<string, number>>(new Map())
  // Queue ICE candidates received before remoteDescription is set (per peer)
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
  // ICE servers fetched from API (Twilio TURN if configured, else openrelay/STUN)
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE_SERVERS)
  const iceServersFetchedAtRef = useRef<number>(0)
  const tokens = useAuthStore((s) => s.tokens)

  // Fetch ICE servers from API. Twilio tokens last 24h, so re-fetch every hour.
  const fetchIceServers = useCallback(async (): Promise<RTCIceServer[]> => {
    const now = Date.now()
    const cacheValid = now - iceServersFetchedAtRef.current < 60 * 60 * 1000
    if (cacheValid && iceServersRef.current !== FALLBACK_ICE_SERVERS) {
      return iceServersRef.current
    }
    const token = tokens?.idToken || tokens?.accessToken
    if (!token || !API_URL) return FALLBACK_ICE_SERVERS
    try {
      const res = await fetch(`${API_URL}/chat/ice-servers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (Array.isArray(data?.iceServers) && data.iceServers.length > 0) {
        iceServersRef.current = data.iceServers
        iceServersFetchedAtRef.current = now
        return data.iceServers
      }
    } catch (err) {
      console.warn('Failed to fetch ICE servers, using fallback:', err)
    }
    return FALLBACK_ICE_SERVERS
  }, [tokens?.idToken, tokens?.accessToken])

  // Voice Activity Detection
  const startVAD = useCallback(() => {
    if (!localStreamRef.current) return

    try {
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(localStreamRef.current)
      
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      microphone.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let speakingTimeout: NodeJS.Timeout | null = null

      const checkVolume = () => {
        if (!analyserRef.current || !currentVoiceRoom) return

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length

        const threshold = 30
        const speaking = average > threshold

        if (speaking !== isSpeaking) {
          setIsSpeaking(speaking)
          socket?.emit('voice_speaking', { room: currentVoiceRoom, speaking })
        }

        if (speaking && speakingTimeout) {
          clearTimeout(speakingTimeout)
          speakingTimeout = null
        } else if (!speaking && !speakingTimeout) {
          speakingTimeout = setTimeout(() => {
            setIsSpeaking(false)
            socket?.emit('voice_speaking', { room: currentVoiceRoom, speaking: false })
          }, 500)
        }

        requestAnimationFrame(checkVolume)
      }

      checkVolume()
    } catch (err) {
      console.error('VAD error:', err)
    }
  }, [currentVoiceRoom, isSpeaking, socket])

  // Create peer connection
  const createPeerConnection = useCallback(
    (socketId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: iceServersRef.current })

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('voice_ice_candidate', {
            targetSocketId: socketId,
            candidate: event.candidate,
          })
        }
      }

      pc.ontrack = (event) => {
        const stream = event.streams[0]
        if (!stream) return

        // Crée un élément audio invisible et joue le stream
        const audioEl = document.createElement('audio')
        audioEl.srcObject = stream
        audioEl.autoplay = true
        audioEl.volume = 1.0

        // Important pour les casques et les mobiles
        audioEl.setAttribute('playsinline', 'true')

        document.body.appendChild(audioEl)

        // Stocke la référence pour cleanup
        audioElementsRef.current.set(socketId, audioEl)

        // Joue immédiatement (certains navigateurs bloquent autoplay)
        audioEl.play().catch(() => {
          // Si autoplay bloqué → attendre interaction utilisateur
          document.addEventListener('click', () => audioEl.play(), { once: true })
        })
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          const retries = retryCountRef.current.get(socketId) || 0
          if (retries < 3) {
            retryCountRef.current.set(socketId, retries + 1)
            setTimeout(() => {
              pc.restartIce()
            }, 1000)
          } else {
            console.error('Peer connection failed after 3 retries')
            peersRef.current.delete(socketId)
          }
        }
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!)
        })
      }

      peersRef.current.set(socketId, pc)
      return pc
    },
    [socket],
  )

  // Join voice room
  const joinVoiceRoom = useCallback(
    async (room: string) => {
      if (!socket || !isConnected) {
        setError('Non connecté au serveur')
        return
      }

      try {
        // Fetch ICE servers BEFORE getUserMedia so peer connections are created
        // with the freshest TURN credentials available.
        await fetchIceServers()

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })

        localStreamRef.current = stream
        setCurrentVoiceRoom(room)
        setIsInVoice(true)
        setError(null)

        socket.emit('voice_join', { room })
        startVAD()
      } catch (err: any) {
        console.error('getUserMedia error:', err)
        if (err.name === 'NotAllowedError') {
          setError('Accès micro refusé')
        } else if (err.name === 'NotFoundError') {
          setError('Aucun microphone détecté')
        } else {
          setError('Erreur d\'accès au microphone')
        }
      }
    },
    [socket, isConnected, startVAD, fetchIceServers],
  )

  // Leave voice room
  const leaveVoiceRoom = useCallback(() => {
    if (!currentVoiceRoom || !socket) return

    // Close all peer connections
    peersRef.current.forEach((pc) => pc.close())
    peersRef.current.clear()

    // Cleanup all audio elements
    audioElementsRef.current.forEach((audioEl) => {
      audioEl.pause()
      audioEl.srcObject = null
      audioEl.remove()
    })
    audioElementsRef.current.clear()

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    socket.emit('voice_leave', { room: currentVoiceRoom })

    setIsInVoice(false)
    setCurrentVoiceRoom(null)
    setVoiceUsers([])
    setIsSpeaking(false)
    retryCountRef.current.clear()
    pendingIceRef.current.clear()
  }, [currentVoiceRoom, socket])

  // Call a user
  const callUser = useCallback(
    (targetUserId: string, targetUsername: string, voiceRoom: string) => {
      if (!socket || !isConnected) return
      socket.emit('call_request', { targetUserId, voiceRoom })
      setCallingUser({ targetUserId, targetUsername, voiceRoom })
      // Auto-cancel after 30s if no response
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current)
      callTimeoutRef.current = setTimeout(() => {
        socket.emit('call_cancelled', { targetUserId })
        setCallingUser(null)
        setError(`${targetUsername} n'a pas répondu`)
        setTimeout(() => setError(null), 4000)
      }, 30000)
    },
    [socket, isConnected],
  )

  // Cancel outgoing call
  const cancelCall = useCallback(() => {
    if (!callingUser) return
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current)
    socket?.emit('call_cancelled', { targetUserId: callingUser.targetUserId })
    setCallingUser(null)
  }, [callingUser, socket])

  // Accept an incoming call
  const acceptCall = useCallback(
    async (call: IncomingCall) => {
      setIncomingCall(null)
      socket?.emit('call_accepted', { callerUserId: call.fromUserId, voiceRoom: call.voiceRoom })
      await joinVoiceRoom(call.voiceRoom)
    },
    [socket, joinVoiceRoom],
  )

  // Decline an incoming call
  const declineCall = useCallback(
    (call: IncomingCall) => {
      setIncomingCall(null)
      socket?.emit('call_declined', { callerUserId: call.fromUserId })
    },
    [socket],
  )

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current || !currentVoiceRoom || !socket) return

    const audioTrack = localStreamRef.current.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      const muted = !audioTrack.enabled
      setIsMuted(muted)
      socket.emit('voice_mute', { room: currentVoiceRoom, muted })
    }
  }, [currentVoiceRoom, socket])

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    const handleVoiceRoomUsers = ({ room, users }: { room: string; users: VoiceUser[] }) => {
      if (room === currentVoiceRoom) {
        setVoiceUsers(users)
        
        // Create offers for existing users
        users.forEach((user) => {
          if (user.socketId !== socket.id && !peersRef.current.has(user.socketId)) {
            const pc = createPeerConnection(user.socketId)
            pc.createOffer()
              .then((offer) => pc.setLocalDescription(offer))
              .then(() => {
                socket.emit('voice_offer', {
                  targetSocketId: user.socketId,
                  offer: pc.localDescription,
                })
              })
              .catch((err) => console.error('Create offer error:', err))
          }
        })
      }
    }

    const handleVoiceUserJoined = ({ socketId, userId, username, avatar }: any) => {
      setVoiceUsers((prev) => [
        ...prev,
        { socketId, userId, username, avatar, muted: false, speaking: false },
      ])
    }

    const handleVoiceUserLeft = ({ socketId }: { socketId: string }) => {
      setVoiceUsers((prev) => prev.filter((u) => u.socketId !== socketId))
      const pc = peersRef.current.get(socketId)
      if (pc) {
        pc.close()
        peersRef.current.delete(socketId)
      }
      pendingIceRef.current.delete(socketId)
      // Cleanup audio element
      const audioEl = audioElementsRef.current.get(socketId)
      if (audioEl) {
        audioEl.pause()
        audioEl.srcObject = null
        audioEl.remove()
        audioElementsRef.current.delete(socketId)
      }
    }

    const flushPendingIce = async (pc: RTCPeerConnection, fromSocketId: string) => {
      const queued = pendingIceRef.current.get(fromSocketId)
      if (!queued || queued.length === 0) return
      for (const c of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(c))
        } catch (err) {
          console.error('Flush queued ICE error:', err)
        }
      }
      pendingIceRef.current.delete(fromSocketId)
    }

    const handleVoiceOffer = async ({ fromSocketId, offer }: any) => {
      const pc = createPeerConnection(fromSocketId)
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        await flushPendingIce(pc, fromSocketId)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('voice_answer', {
          targetSocketId: fromSocketId,
          answer: pc.localDescription,
        })
      } catch (err) {
        console.error('Handle offer error:', err)
      }
    }

    const handleVoiceAnswer = async ({ fromSocketId, answer }: any) => {
      const pc = peersRef.current.get(fromSocketId)
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer))
          await flushPendingIce(pc, fromSocketId)
        } catch (err) {
          console.error('Handle answer error:', err)
        }
      }
    }

    const handleVoiceIceCandidate = async ({ fromSocketId, candidate }: any) => {
      const pc = peersRef.current.get(fromSocketId)
      // Queue if peer not ready or remoteDescription not set yet
      if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
        const q = pendingIceRef.current.get(fromSocketId) ?? []
        q.push(candidate)
        pendingIceRef.current.set(fromSocketId, q)
        return
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error('Add ICE candidate error:', err)
      }
    }

    const handleVoiceSpeaking = ({ userId, speaking }: { userId: string; speaking: boolean }) => {
      setVoiceUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, speaking } : u)),
      )
    }

    const handleVoiceMuteUpdate = ({ userId, muted }: { userId: string; muted: boolean }) => {
      setVoiceUsers((prev) =>
        prev.map((u) => (u.userId === userId ? { ...u, muted } : u)),
      )
    }

    const handleVoiceCounts = (counts: Record<string, number>) => {
      setVoiceChannelCounts(counts)
    }

    const handleCallRequest = (data: IncomingCall) => {
      setIncomingCall(data)
    }

    const handleCallAccepted = async (data: { fromUserId: string; fromUsername: string; voiceRoom: string }) => {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current)
      setCallingUser(null)
      await joinVoiceRoom(data.voiceRoom)
    }

    const handleCallDeclined = (data: { fromUserId: string; fromUsername: string }) => {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current)
      setCallingUser(null)
      setError(`${data.fromUsername} a refusé l'appel`)
      setTimeout(() => setError(null), 4000)
    }

    const handleCallCancelled = () => {
      setIncomingCall(null)
    }

    socket.on('voice_room_users', handleVoiceRoomUsers)
    socket.on('voice_user_joined', handleVoiceUserJoined)
    socket.on('voice_user_left', handleVoiceUserLeft)
    socket.on('voice_offer', handleVoiceOffer)
    socket.on('voice_answer', handleVoiceAnswer)
    socket.on('voice_ice_candidate', handleVoiceIceCandidate)
    socket.on('voice_speaking', handleVoiceSpeaking)
    socket.on('voice_mute_update', handleVoiceMuteUpdate)
    socket.on('voice_counts', handleVoiceCounts)
    socket.on('call_request', handleCallRequest)
    socket.on('call_accepted', handleCallAccepted)
    socket.on('call_declined', handleCallDeclined)
    socket.on('call_cancelled', handleCallCancelled)

    return () => {
      socket.off('voice_room_users', handleVoiceRoomUsers)
      socket.off('voice_user_joined', handleVoiceUserJoined)
      socket.off('voice_user_left', handleVoiceUserLeft)
      socket.off('voice_offer', handleVoiceOffer)
      socket.off('voice_answer', handleVoiceAnswer)
      socket.off('voice_ice_candidate', handleVoiceIceCandidate)
      socket.off('voice_speaking', handleVoiceSpeaking)
      socket.off('voice_mute_update', handleVoiceMuteUpdate)
      socket.off('voice_counts', handleVoiceCounts)
      socket.off('call_request', handleCallRequest)
      socket.off('call_accepted', handleCallAccepted)
      socket.off('call_declined', handleCallDeclined)
      socket.off('call_cancelled', handleCallCancelled)
    }
  }, [socket, currentVoiceRoom, createPeerConnection])

  // Ringback tone (caller side) and incoming-call ringtone (callee side).
  // Both respect the global sound-enabled preference.
  const { soundEnabled } = useSoundNotification()
  const { startRing: startRingback, stopRing: stopRingback } = useCallRingtone()
  const { startRing: startIncomingRing, stopRing: stopIncomingRing } = useCallRingtone()

  useEffect(() => {
    if (callingUser && soundEnabled) startRingback('ringback')
    else stopRingback()
    return () => stopRingback()
  }, [callingUser?.targetUserId, soundEnabled])

  useEffect(() => {
    if (incomingCall && soundEnabled) startIncomingRing('incoming')
    else stopIncomingRing()
    return () => stopIncomingRing()
  }, [incomingCall?.fromUserId, soundEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current)
        callTimeoutRef.current = null
      }
      if (isInVoice) {
        leaveVoiceRoom()
      }
    }
  }, [])

  return {
    isInVoice,
    currentVoiceRoom,
    voiceUsers,
    isMuted,
    isSpeaking,
    error,
    incomingCall,
    callingUser,
    voiceChannelCounts,
    joinVoiceRoom,
    leaveVoiceRoom,
    toggleMute,
    callUser,
    acceptCall,
    declineCall,
    cancelCall,
  }
}
