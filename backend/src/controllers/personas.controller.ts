import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'
import { z } from 'zod'

const personaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  cedula: z.string().min(1, 'La cédula es obligatoria'),
  id_municipio: z.coerce.number().default(1),
  id_rol: z.coerce.number().default(3).refine((val) => [2, 3].includes(val), {
    message: 'Una persona solo puede tener rol Transformador (2) o Reciclador (3)',
  }),
})

export async function createPersona(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id

    const existingPer = await pool.query('SELECT id FROM personas WHERE id_usuario = $1', [userId])
    if (existingPer.rows.length > 0) {
      return res.status(409).json({ ok: false, error: 'El usuario ya tiene un perfil de persona registrado.' })
    }

    const body = personaSchema.parse(req.body)

    const result = await pool.query(
      `INSERT INTO personas (id_usuario, nombre, cedula, id_municipio, id_rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, id_usuario, nombre, cedula, id_municipio, id_rol`,
      [userId, body.nombre, body.cedula, body.id_municipio, body.id_rol]
    )

    return res.status(201).json({
      ok: true,
      mensaje: 'Persona natural registrada exitosamente',
      persona: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
}
