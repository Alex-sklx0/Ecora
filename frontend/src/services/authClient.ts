import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ?? 'http://localhost:8000',
})
