import { Response, NextFunction } from 'express'
import { auth } from '../config/auth'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const sessionRes = await auth.api.getSession({
      headers: req.headers as any,
    })

    if (sessionRes && sessionRes.user) {
      req.user = sessionRes.user as any
      req.session = sessionRes.session as any

      const empRes = await pool.query(
        'SELECT id FROM empresas WHERE id_usuario = $1 LIMIT 1',
        [sessionRes.user.id]
      )
      if (empRes.rows.length > 0) {
        req.empresaId = Number(empRes.rows[0].id)
      }

      const perRes = await pool.query(
        'SELECT id FROM personas WHERE id_usuario = $1 LIMIT 1',
        [sessionRes.user.id]
      )
      if (perRes.rows.length > 0) {
        req.personaId = Number(perRes.rows[0].id)
      }
    }
  } catch {
    // Si falla la verificación opcional, continúa sin sesión
  }
  next()
}
