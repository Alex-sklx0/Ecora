import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { chatApi, type Mensaje } from '../services/chatApi'

export function useChat(conversacionId: number | null) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Carga inicial de mensajes
  const cargar = useCallback(async () => {
    if (!conversacionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await chatApi.getMensajes(conversacionId, { limit: 50 })
      setMensajes(res.mensajes)
      // Marcar como leídos al abrir
      await chatApi.marcarLeidos(conversacionId).catch(() => {})
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar mensajes')
    } finally {
      setLoading(false)
    }
  }, [conversacionId])

  // Suscripción Realtime
  useEffect(() => {
    if (!conversacionId) return

    cargar()

    const channel = supabase
      .channel(`conversacion:${conversacionId}`)
      .on('broadcast', { event: 'nuevo_mensaje' }, ({ payload }: { payload: Mensaje }) => {
        const msg = payload as Mensaje
        setMensajes((prev) => {
          // Evitar duplicados si ya llegó por optimistic update
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [conversacionId, cargar])

  const enviar = useCallback(
    async (contenido: string) => {
      if (!conversacionId || !contenido.trim() || enviando) return
      setEnviando(true)
      try {
        const res = await chatApi.enviarMensaje(conversacionId, contenido.trim())
        // Optimistic: el backend también hace broadcast, pero lo agregamos de inmediato
        setMensajes((prev) =>
          prev.some((m) => m.id === res.mensaje.id) ? prev : [...prev, res.mensaje]
        )
      } catch (e: any) {
        setError(e.message ?? 'Error al enviar mensaje')
      } finally {
        setEnviando(false)
      }
    },
    [conversacionId, enviando]
  )

  return { mensajes, loading, error, enviando, enviar }
}
