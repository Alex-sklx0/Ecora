export interface Usuario {
  id: string
  email: string
  name: string
}

export interface Empresa {
  id: number
  id_usuario: string
  nombre: string
  nit: string
  id_municipio: number
  id_rol: number
}

export interface Persona {
  id: number
  id_usuario: string
  nombre: string
  cedula: string
  id_municipio: number
  id_rol: number
}

export interface PerfilMe {
  ok: boolean
  usuario: Usuario
  tipo_usuario: 'empresa' | 'persona' | 'sin_perfil'
  empresa: Empresa | null
  persona: Persona | null
}

export interface FrecuenciaProducto {
  id: number
  nombre: string
}

export interface Subproducto {
  id: number
  id_empresa: number
  nombre: string
  id_familia_material: number
  familia_material?: string
  volumen_disponible: number
  id_unidad_medida: number
  unidad_medida?: string
  unidad_medida_abreviatura?: string
  descripcion?: string
  id_municipio: number
  municipio?: string
  direccion?: string
  fecha_registro: string
  precio_inicial: number
  foto_url?: string
  disponible: boolean
  id_frecuencia?: number
  frecuencia?: string
  empresa_nombre?: string
}

export interface Intercambio {
  id: number
  id_subproducto: number
  id_usuario_comprador: string
  id_usuario_vendedor: string
  fecha_intercambio: string
  precio_final: number
  estado_pago: 'pendiente' | 'pagado' | 'fallido' | 'reembolsado'
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  subproducto: { id: number; nombre: string; foto_url?: string }
  comprador: { id: string; nombre: string }
  vendedor: { id: string; nombre: string }
  contraparte: { id: string; nombre: string }
}

export interface Catalogo {
  id: number
  nombre: string
}

export interface ApiResponse<T> {
  ok: boolean
  mensaje?: string
  error?: string
  data?: T
}
