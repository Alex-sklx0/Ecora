import { api } from './api'

export interface Conversacion {
  id: number
  id_usuario_a: string
  id_usuario_b: string
  created_at: string
  ultimo_mensaje_at: string
  ultimo_contenido: string | null
  no_leidos: number
  contraparte: { id: string; nombre: string }
}

export interface Mensaje {
  id: number
  id_conversacion: number
  id_emisor: string
  nombre_emisor?: string
  contenido: string
  created_at: string
  leido: boolean
}

export const chatApi = {
  getConversaciones: () =>
    api.get<{ ok: boolean; conversaciones: Conversacion[] }>('/conversaciones'),

  crearConversacion: (id_usuario_destino: string) =>
    api.post<{ ok: boolean; conversacion: Conversacion; nueva: boolean }>('/conversaciones', {
      id_usuario_destino,
    }),

  getMensajes: (id: number, params?: { limit?: number; before?: string }) => {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.before) qs.set('before', params.before)
    const q = qs.toString()
    return api.get<{ ok: boolean; mensajes: Mensaje[] }>(`/conversaciones/${id}/mensajes${q ? `?${q}` : ''}`)
  },

  enviarMensaje: (id: number, contenido: string) =>
    api.post<{ ok: boolean; mensaje: Mensaje }>(`/conversaciones/${id}/mensajes`, { contenido }),

  marcarLeidos: (id: number) =>
    api.patch<{ ok: boolean; actualizados: number }>(`/conversaciones/${id}/mensajes/leidos`, {}),
}
