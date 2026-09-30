import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'

export async function getIntercambios(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id
    const { rol } = req.query

    let whereClause = '(i.id_usuario_comprador = $1 OR i.id_usuario_vendedor = $1)'
    if (rol === 'comprador') {
      whereClause = 'i.id_usuario_comprador = $1'
    } else if (rol === 'vendedor') {
      whereClause = 'i.id_usuario_vendedor = $1'
    }

    const query = `
      SELECT i.*,
             s.nombre AS subproducto_nombre,
             s.foto_url AS subproducto_foto_url,
             uc.name AS comprador_nombre,
             uv.name AS vendedor_nombre
      FROM intercambios i
      JOIN subproductos s ON i.id_subproducto = s.id
      JOIN "user" uc ON i.id_usuario_comprador = uc.id
      JOIN "user" uv ON i.id_usuario_vendedor = uv.id
      WHERE ${whereClause}
      ORDER BY i.fecha_intercambio DESC
    `

    const result = await pool.query(query, [userId])

    const intercambios = result.rows.map((row) => {
      const isComprador = row.id_usuario_comprador === userId
      return {
        id: Number(row.id),
        id_subproducto: Number(row.id_subproducto),
        id_usuario_comprador: row.id_usuario_comprador,
        id_usuario_vendedor: row.id_usuario_vendedor,
        fecha_intercambio: row.fecha_intercambio,
        precio_final: Number(row.precio_final),
        estado_pago: row.estado_pago,
        stripe_session_id: row.stripe_session_id,
        stripe_payment_intent_id: row.stripe_payment_intent_id,
        subproducto: {
          id: Number(row.id_subproducto),
          nombre: row.subproducto_nombre,
          foto_url: row.subproducto_foto_url,
        },
        comprador: { id: row.id_usuario_comprador, nombre: row.comprador_nombre },
        vendedor: { id: row.id_usuario_vendedor, nombre: row.vendedor_nombre },
        contraparte: isComprador
          ? { id: row.id_usuario_vendedor, nombre: row.vendedor_nombre }
          : { id: row.id_usuario_comprador, nombre: row.comprador_nombre },
      }
    })

    return res.json({ ok: true, intercambios })
  } catch (error) {
    next(error)
  }
}

export async function getIntercambioById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' })

    const userId = req.user!.id

    const query = `
      SELECT i.*,
             s.nombre AS subproducto_nombre,
             s.foto_url AS subproducto_foto_url,
             s.descripcion AS subproducto_descripcion,
             uc.name AS comprador_nombre,
             uv.name AS vendedor_nombre
      FROM intercambios i
      JOIN subproductos s ON i.id_subproducto = s.id
      JOIN "user" uc ON i.id_usuario_comprador = uc.id
      JOIN "user" uv ON i.id_usuario_vendedor = uv.id
      WHERE i.id = $1
    `

    const result = await pool.query(query, [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Intercambio no encontrado' })
    }

    const row = result.rows[0]
    if (row.id_usuario_comprador !== userId && row.id_usuario_vendedor !== userId) {
      return res.status(403).json({
        ok: false,
        error: 'No tienes permiso para ver este intercambio.',
      })
    }

    const isComprador = row.id_usuario_comprador === userId

    return res.json({
      ok: true,
      intercambio: {
        id: Number(row.id),
        id_subproducto: Number(row.id_subproducto),
        id_usuario_comprador: row.id_usuario_comprador,
        id_usuario_vendedor: row.id_usuario_vendedor,
        fecha_intercambio: row.fecha_intercambio,
        precio_final: Number(row.precio_final),
        estado_pago: row.estado_pago,
        stripe_session_id: row.stripe_session_id,
        stripe_payment_intent_id: row.stripe_payment_intent_id,
        subproducto: {
          id: Number(row.id_subproducto),
          nombre: row.subproducto_nombre,
          foto_url: row.subproducto_foto_url,
          descripcion: row.subproducto_descripcion,
        },
        comprador: { id: row.id_usuario_comprador, nombre: row.comprador_nombre },
        vendedor: { id: row.id_usuario_vendedor, nombre: row.vendedor_nombre },
        contraparte: isComprador
          ? { id: row.id_usuario_vendedor, nombre: row.vendedor_nombre }
          : { id: row.id_usuario_comprador, nombre: row.comprador_nombre },
      },
    })
  } catch (error) {
    next(error)
  }
}
