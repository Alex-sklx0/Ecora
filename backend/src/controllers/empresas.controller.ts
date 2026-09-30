import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'
import { z } from 'zod'

const empresaSchema = z.object({
  nombre: z.string().min(1, 'El nombre de la empresa es obligatorio'),
  nit: z.string().min(1, 'El NIT es obligatorio'),
  id_municipio: z.coerce.number().default(1),
  id_rol: z.coerce.number().refine((val) => [1, 2].includes(val), {
    message: 'Una empresa solo puede tener rol Generador (1) o Transformador (2)',
  }),
})

export async function createEmpresa(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.id

    // Verificar si ya tiene perfil empresa o persona
    const existingEmp = await pool.query('SELECT id FROM empresas WHERE id_usuario = $1', [userId])
    if (existingEmp.rows.length > 0) {
      return res.status(409).json({ ok: false, error: 'El usuario ya tiene un perfil de empresa registrado.' })
    }

    const body = empresaSchema.parse(req.body)

    const result = await pool.query(
      `INSERT INTO empresas (id_usuario, nombre, nit, id_municipio, id_rol)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, id_usuario, nombre, nit, id_municipio, id_rol`,
      [userId, body.nombre, body.nit, body.id_municipio, body.id_rol]
    )

    return res.status(201).json({
      ok: true,
      mensaje: 'Empresa registrada exitosamente',
      empresa: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
}
