import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authClient } from '../services/authClient'
import { api } from '../services/api'
import { PerfilMe, Usuario, Empresa, Persona } from '../types'

interface AuthContextValue {
  user: Usuario | null
  tipoUsuario: 'empresa' | 'persona' | 'sin_perfil'
  empresa: Empresa | null
  persona: Persona | null
  loading: boolean
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  tipoUsuario: 'sin_perfil',
  empresa: null,
  persona: null,
  loading: true,
  refetch: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [tipoUsuario, setTipoUsuario] = useState<'empresa' | 'persona' | 'sin_perfil'>('sin_perfil')
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchSession() {
    try {
      const me = await api.get<PerfilMe>('/usuarios/me')
      if (me.ok && me.usuario) {
        setUser(me.usuario)
        setTipoUsuario(me.tipo_usuario)
        setEmpresa(me.empresa)
        setPersona(me.persona)
      } else {
        setUser(null)
        setTipoUsuario('sin_perfil')
        setEmpresa(null)
        setPersona(null)
      }
    } catch {
      setUser(null)
      setTipoUsuario('sin_perfil')
      setEmpresa(null)
      setPersona(null)
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      await authClient.signOut()
    } catch (err) {
      console.error('Error cerrando sesión:', err)
    } finally {
      setUser(null)
      setTipoUsuario('sin_perfil')
      setEmpresa(null)
      setPersona(null)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, tipoUsuario, empresa, persona, loading, refetch: fetchSession, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
