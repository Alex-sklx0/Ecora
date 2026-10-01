import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'
import { supabase } from '../config/supabase'

// GET /api/conversaciones
export async function getConversaciones(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id

    const result = await pool.query(
      `SELECT c.*,
              ua.name AS nombre_usuario_a,
              ub.name AS nombre_usuario_b,
              (
                SELECT contenido FROM mensajes
                WHERE id_conversacion = c.id
                ORDER BY created_at DESC LIMIT 1
              ) AS ultimo_contenido,
              (
                SELECT COUNT(*) FROM mensajes
                WHERE id_conversacion = c.id AND leido = FALSE AND id_emisor <> $1
              ) AS no_leidos
       FROM conversaciones c
       JOIN "user" ua ON c.id_usuario_a = ua.id
       JOIN "user" ub ON c.id_usuario_b = ub.id
       WHERE c.id_usuario_a = $1 OR c.id_usuario_b = $1
       ORDER BY c.ultimo_mensaje_at DESC`,
      [userId]
    )

    const conversaciones = result.rows.map((row) => ({
      id: Number(row.id),
      id_usuario_a: row.id_usuario_a,
      id_usuario_b: row.id_usuario_b,
      created_at: row.created_at,
      ultimo_mensaje_at: row.ultimo_mensaje_at,
      ultimo_contenido: row.ultimo_contenido ?? null,
      no_leidos: Number(row.no_leidos),
      contraparte:
        row.id_usuario_a === userId
          ? { id: row.id_usuario_b, nombre: row.nombre_usuario_b }
          : { id: row.id_usuario_a, nombre: row.nombre_usuario_a },
    }))

    return res.json({ ok: true, conversaciones })
  } catch (error) {
    next(error)
  }
}

// POST /api/conversaciones
export async function crearConversacion(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id
    const { id_usuario_destino } = req.body

    if (!id_usuario_destino || typeof id_usuario_destino !== 'string') {
      return res.status(400).json({ ok: false, error: 'id_usuario_destino requerido' })
    }
    if (id_usuario_destino === userId) {
      return res.status(400).json({ ok: false, error: 'No puedes iniciar un chat contigo mismo' })
    }

    // Verificar que el usuario destino existe
    const userCheck = await pool.query('SELECT id FROM "user" WHERE id = $1', [id_usuario_destino])
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Usuario destino no encontrado' })
    }

    // Buscar conversación existente (ignorando orden A/B)
    const existing = await pool.query(
      `SELECT * FROM conversaciones
       WHERE LEAST(id_usuario_a, id_usuario_b) = LEAST($1, $2)
         AND GREATEST(id_usuario_a, id_usuario_b) = GREATEST($1, $2)`,
      [userId, id_usuario_destino]
    )

    if (existing.rows.length > 0) {
      return res.json({ ok: true, conversacion: existing.rows[0], nueva: false })
    }

    const insert = await pool.query(
      `INSERT INTO conversaciones (id_usuario_a, id_usuario_b)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, id_usuario_destino]
    )

    return res.status(201).json({ ok: true, conversacion: insert.rows[0], nueva: true })
  } catch (error) {
    next(error)
  }
}

// GET /api/conversaciones/:id/mensajes
export async function getMensajes(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' })

    const conv = await pool.query('SELECT * FROM conversaciones WHERE id = $1', [id])
    if (conv.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Conversación no encontrada' })
    }
    const c = conv.rows[0]
    if (c.id_usuario_a !== userId && c.id_usuario_b !== userId) {
      return res.status(403).json({ ok: false, error: 'Sin acceso a esta conversación' })
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const before = req.query.before ? new Date(req.query.before as string) : null

    const params: unknown[] = [id, limit]
    const beforeClause = before ? `AND m.created_at < $3` : ''
    if (before) params.push(before)

    const result = await pool.query(
      `SELECT m.*, u.name AS nombre_emisor
       FROM mensajes m
       JOIN "user" u ON m.id_emisor = u.id
       WHERE m.id_conversacion = $1 ${beforeClause}
       ORDER BY m.created_at DESC
       LIMIT $2`,
      params
    )

    const mensajes = result.rows.reverse().map((row) => ({
      id: Number(row.id),
      id_conversacion: Number(row.id_conversacion),
      id_emisor: row.id_emisor,
      nombre_emisor: row.nombre_emisor,
      contenido: row.contenido,
      created_at: row.created_at,
      leido: row.leido,
    }))

    return res.json({ ok: true, mensajes })
  } catch (error) {
    next(error)
  }
}

// POST /api/conversaciones/:id/mensajes
export async function enviarMensaje(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' })

    const conv = await pool.query('SELECT * FROM conversaciones WHERE id = $1', [id])
    if (conv.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Conversación no encontrada' })
    }
    const c = conv.rows[0]
    if (c.id_usuario_a !== userId && c.id_usuario_b !== userId) {
      return res.status(403).json({ ok: false, error: 'Sin acceso a esta conversación' })
    }

    const { contenido } = req.body
    if (!contenido || typeof contenido !== 'string' || contenido.trim().length === 0) {
      return res.status(400).json({ ok: false, error: 'contenido requerido' })
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const msgResult = await client.query(
        `INSERT INTO mensajes (id_conversacion, id_emisor, contenido)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [id, userId, contenido.trim()]
      )

      await client.query(
        `UPDATE conversaciones SET ultimo_mensaje_at = NOW() WHERE id = $1`,
        [id]
      )

      await client.query('COMMIT')

      const mensaje = {
        id: Number(msgResult.rows[0].id),
        id_conversacion: id,
        id_emisor: userId,
        contenido: msgResult.rows[0].contenido,
        created_at: msgResult.rows[0].created_at,
        leido: false,
      }

      // Broadcast vía Supabase Realtime
      await supabase
        .channel(`conversacion:${id}`)
        .send({ type: 'broadcast', event: 'nuevo_mensaje', payload: mensaje })

      return res.status(201).json({ ok: true, mensaje })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (error) {
    next(error)
  }
}

// PATCH /api/conversaciones/:id/mensajes/leidos
export async function marcarLeidos(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' })

    const conv = await pool.query('SELECT * FROM conversaciones WHERE id = $1', [id])
    if (conv.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Conversación no encontrada' })
    }
    const c = conv.rows[0]
    if (c.id_usuario_a !== userId && c.id_usuario_b !== userId) {
      return res.status(403).json({ ok: false, error: 'Sin acceso a esta conversación' })
    }

    const result = await pool.query(
      `UPDATE mensajes
       SET leido = TRUE
       WHERE id_conversacion = $1 AND id_emisor <> $2 AND leido = FALSE
       RETURNING id`,
      [id, userId]
    )

    return res.json({ ok: true, actualizados: result.rowCount })
  } catch (error) {
    next(error)
  }
}
