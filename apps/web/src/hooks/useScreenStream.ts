'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

/**
 * Captures the user's screen + audio with `getDisplayMedia` and forwards the
 * encoded chunks to the backend RTMP relay over a WebSocket. The backend is
 * expected to expose `${API_URL}/rtmp-ws`, accept a `{type:'config',rtmpUrl}`
 * handshake message, then transcode the WebM stream into RTMP/FLV before
 * forwarding it to the configured ingest endpoint (e.g. YouTube live).
 *
 * The hook owns the MediaRecorder + WebSocket lifecycle and exposes a small
 * imperative API. Callers must invoke `stopStream` when they're done — we
 * already auto-stop when the user revokes the screen-share permission.
 */
export interface UseScreenStreamResult {
  /**
   * Begin capturing the screen and pushing chunks to the backend RTMP relay.
   * The `authToken` is forwarded as a `?token=` query param so the gateway
   * can authenticate the WebSocket upgrade before spawning ffmpeg.
   */
  startStream: (
    rtmpEndpoint: string,
    streamKey: string,
    authToken: string,
  ) => Promise<void>
  stopStream: () => void
  isStreaming: boolean
  error: string | null
}

export function useScreenStream(): UseScreenStreamResult {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /**
   * Tears every resource down in a deterministic order so a partial failure
   * never leaves a dangling MediaStream / camera light on.
   */
  const cleanup = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    } catch {
      /* ignore — recorder may already be in a terminal state */
    }
    mediaRecorderRef.current = null

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.close()
      } catch {
        /* ignore */
      }
    }
    wsRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {
          /* ignore */
        }
      })
      streamRef.current = null
    }

    setIsStreaming(false)
  }, [])

  const stopStream = useCallback(() => {
    cleanup()
  }, [cleanup])

  const startStream = useCallback(
    async (rtmpEndpoint: string, streamKey: string, authToken: string) => {
      setError(null)

      if (!authToken) {
        setError('Token manquant — reconnecte-toi')
        return
      }

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
        setError("Le partage d'écran n'est pas supporté par ce navigateur")
        return
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1280, height: 720, frameRate: 30 },
          audio: true,
        })
      } catch (err) {
        const name = (err as DOMException | Error & { name?: string }).name
        if (name === 'NotAllowedError') {
          setError("Partage d'écran refusé — autorise le dans le navigateur")
        } else if (name === 'NotFoundError') {
          setError('Aucune source de partage disponible')
        } else {
          setError('Impossible de démarrer le partage')
        }
        return
      }

      streamRef.current = stream

      // Auto-stop when the user clicks the browser's "Stop sharing" overlay.
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.onended = () => {
          cleanup()
        }
      }

      // Pick the best WebM codec the browser supports — VP9 first, fall back
      // to VP8. The backend transcoder must handle both.
      const candidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ]
      const mimeType = candidates.find((c) =>
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c),
      )

      if (!mimeType) {
        cleanup()
        setError("Aucun codec d'encodage supporté")
        return
      }

      let wsUrl: string
      try {
        const u = new URL('/rtmp-ws', API_URL)
        u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'
        u.searchParams.set('token', authToken)
        wsUrl = u.toString()
      } catch {
        cleanup()
        setError("URL d'API invalide")
        return
      }

      const ws = new WebSocket(wsUrl)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        // Hand the upstream RTMP target to the relay — it will spin up an
        // ffmpeg process keyed on this WebSocket.
        ws.send(
          JSON.stringify({
            type: 'config',
            rtmpUrl: `${rtmpEndpoint.replace(/\/$/, '')}/${streamKey}`,
          }),
        )

        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: 2_500_000,
          audioBitsPerSecond: 128_000,
        })

        recorder.ondataavailable = async (event) => {
          if (
            event.data.size > 0 &&
            wsRef.current?.readyState === WebSocket.OPEN
          ) {
            try {
              const buffer = await event.data.arrayBuffer()
              wsRef.current.send(buffer)
            } catch {
              /* network hiccup — chunk is dropped, MediaRecorder keeps going */
            }
          }
        }

        recorder.onerror = () => {
          setError("Erreur d'enregistrement")
          cleanup()
        }

        recorder.start(1000)
        mediaRecorderRef.current = recorder
        setIsStreaming(true)
      }

      ws.onerror = () => {
        setError('Connexion au relais RTMP impossible')
        cleanup()
      }

      ws.onclose = () => {
        // Closure may be remote (server restart) or local (stopStream).
        if (mediaRecorderRef.current) {
          cleanup()
        }
      }
    },
    [cleanup],
  )

  // Final safety net: ensure tracks are released if the consumer unmounts
  // without calling stopStream().
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return { startStream, stopStream, isStreaming, error }
}

export default useScreenStream
