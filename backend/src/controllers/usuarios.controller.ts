import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = req.user!

    let tipo_usuario: 'empresa' | 'persona' | 'sin_perfil' = 'sin_perfil'
    let empresa: any = null
    let persona: any = null

    const empRes = await pool.query('SELECT * FROM empresas WHERE id_usuario = $1 LIMIT 1', [
      user.id,
    ])
    if (empRes.rows.length > 0) {
      tipo_usuario = 'empresa'
      empresa = empRes.rows[0]
    } else {
      const perRes = await pool.query('SELECT * FROM personas WHERE id_usuario = $1 LIMIT 1', [
        user.id,
      ])
      if (perRes.rows.length > 0) {
        tipo_usuario = 'persona'
        persona = perRes.rows[0]
      }
    }

    return res.json({
      ok: true,
      usuario: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tipo_usuario,
      empresa,
      persona,
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      // Si es empresa, borrar subproductos asociados
      const empRes = await client.query('SELECT id FROM empresas WHERE id_usuario = $1', [userId])
      if (empRes.rows.length > 0) {
        const empId = empRes.rows[0].id
        await client.query('DELETE FROM subproductos WHERE id_empresa = $1', [empId])
        await client.query('DELETE FROM empresas WHERE id = $1', [empId])
      }

      await client.query('DELETE FROM personas WHERE id_usuario = $1', [userId])
      await client.query('DELETE FROM session WHERE "userId" = $1', [userId])
      await client.query('DELETE FROM account WHERE "userId" = $1', [userId])
      await client.query('DELETE FROM "user" WHERE id = $1', [userId])

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    return res.json({ ok: true, mensaje: 'Cuenta eliminada exitosamente' })
  } catch (error) {
    next(error)
  }
}
