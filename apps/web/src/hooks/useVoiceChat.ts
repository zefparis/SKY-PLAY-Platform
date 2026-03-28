'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { VoiceUser } from '@/types/voice'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

type UseVoiceChatProps = {
  socket: Socket | null
  isConnected: boolean
}

export function useVoiceChat({ socket, isConnected }: UseVoiceChatProps) {
  const [isInVoice, setIsInVoice] = useState(false)
  const [currentVoiceRoom, setCurrentVoiceRoom] = useState<string | null>(null)
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const retryCountRef = useRef<Map<string, number>>(new Map())

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
      const pc = new RTCPeerConnection(RTC_CONFIG)

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
    [socket, isConnected, startVAD],
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
  }, [currentVoiceRoom, socket])

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
      // Cleanup audio element
      const audioEl = audioElementsRef.current.get(socketId)
      if (audioEl) {
        audioEl.pause()
        audioEl.srcObject = null
        audioEl.remove()
        audioElementsRef.current.delete(socketId)
      }
    }

    const handleVoiceOffer = async ({ fromSocketId, offer }: any) => {
      const pc = createPeerConnection(fromSocketId)
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
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
        } catch (err) {
          console.error('Handle answer error:', err)
        }
      }
    }

    const handleVoiceIceCandidate = async ({ fromSocketId, candidate }: any) => {
      const pc = peersRef.current.get(fromSocketId)
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.error('Add ICE candidate error:', err)
        }
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

    socket.on('voice_room_users', handleVoiceRoomUsers)
    socket.on('voice_user_joined', handleVoiceUserJoined)
    socket.on('voice_user_left', handleVoiceUserLeft)
    socket.on('voice_offer', handleVoiceOffer)
    socket.on('voice_answer', handleVoiceAnswer)
    socket.on('voice_ice_candidate', handleVoiceIceCandidate)
    socket.on('voice_speaking', handleVoiceSpeaking)
    socket.on('voice_mute_update', handleVoiceMuteUpdate)

    return () => {
      socket.off('voice_room_users', handleVoiceRoomUsers)
      socket.off('voice_user_joined', handleVoiceUserJoined)
      socket.off('voice_user_left', handleVoiceUserLeft)
      socket.off('voice_offer', handleVoiceOffer)
      socket.off('voice_answer', handleVoiceAnswer)
      socket.off('voice_ice_candidate', handleVoiceIceCandidate)
      socket.off('voice_speaking', handleVoiceSpeaking)
      socket.off('voice_mute_update', handleVoiceMuteUpdate)
    }
  }, [socket, currentVoiceRoom, createPeerConnection])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    joinVoiceRoom,
    leaveVoiceRoom,
    toggleMute,
  }
}
