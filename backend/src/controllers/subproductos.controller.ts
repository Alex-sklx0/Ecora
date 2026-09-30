import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'
import { uploadImage, deleteImage } from '../services/storage.service'
import { resolveCatalogId } from '../services/catalogo.service'
import { z } from 'zod'

const createSubproductoSchema = z.object({
  nombre: z.string().min(1, 'El nombre del subproducto es obligatorio'),
  descripcion: z.string().optional(),
  id_familia_material: z.union([z.number(), z.string()]).default(5),
  volumen_disponible: z.coerce.number().positive('El volumen debe ser mayor a 0'),
  id_unidad_medida: z.union([z.number(), z.string()]).default(1),
  id_municipio: z.union([z.number(), z.string()]).default(1),
  direccion: z.string().optional(),
  precio_inicial: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  id_frecuencia: z.union([z.number(), z.string()]).optional(),
  image_base64: z.string().optional(),
})

const patchSubproductoSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  id_familia_material: z.union([z.number(), z.string()]).optional(),
  volumen_disponible: z.coerce.number().positive().optional(),
  id_unidad_medida: z.union([z.number(), z.string()]).optional(),
  id_municipio: z.union([z.number(), z.string()]).optional(),
  direccion: z.string().optional(),
  precio_inicial: z.coerce.number().min(0).optional(),
  id_frecuencia: z.union([z.number(), z.string()]).optional(),
  foto_url: z.string().optional(),
  image_base64: z.string().optional(),
  disponible: z.boolean().optional(),
})

export async function createSubproducto(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.empresaId) {
      return res.status(403).json({
        ok: false,
        error: 'Solo los usuarios con perfil de empresa pueden publicar subproductos.',
      })
    }

    const body = createSubproductoSchema.parse(req.body)

    // Resolver catálogos por nombre o ID
    const idFamilia = await resolveCatalogId('familias_material', body.id_familia_material)
    const idUnidad = await resolveCatalogId('unidades_medida', body.id_unidad_medida)
    const idMunicipio = await resolveCatalogId('municipios', body.id_municipio)
    const idFrecuencia = body.id_frecuencia
      ? await resolveCatalogId('frecuencia_producto', body.id_frecuencia)
      : null

    let foto_url: string | null = null
    if (body.image_base64) {
      foto_url = await uploadImage(body.image_base64)
    }

    const query = `
      INSERT INTO subproductos (
        id_empresa, nombre, id_familia_material, volumen_disponible,
        id_unidad_medida, descripcion, id_municipio, direccion,
        precio_inicial, foto_url, id_frecuencia, disponible
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING *
    `

    const values = [
      req.empresaId,
      body.nombre,
      idFamilia,
      body.volumen_disponible,
      idUnidad,
      body.descripcion || null,
      idMunicipio,
      body.direccion || null,
      body.precio_inicial,
      foto_url,
      idFrecuencia,
    ]

    const result = await pool.query(query, values)

    return res.status(201).json({
      ok: true,
      mensaje: 'Subproducto publicado exitosamente',
      subproducto: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
}

export async function uploadImageIsolated(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { image_base64 } = req.body
    if (!image_base64) {
      return res.status(400).json({ ok: false, error: 'Se requiere el campo image_base64' })
    }

    const url = await uploadImage(image_base64)
    return res.json({ ok: true, url })
  } catch (error) {
    next(error)
  }
}

export async function getMisPublicaciones(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.empresaId) {
      return res.status(403).json({
        ok: false,
        error: 'Acceso denegado. Se requiere perfil de empresa.',
      })
    }

    const query = `
      SELECT s.*,
             fm.nombre AS familia_material,
             um.nombre AS unidad_medida,
             um.abreviatura AS unidad_medida_abreviatura,
             m.nombre AS municipio,
             fp.nombre AS frecuencia
      FROM subproductos s
      LEFT JOIN familias_material fm ON s.id_familia_material = fm.id
      LEFT JOIN unidades_medida um ON s.id_unidad_medida = um.id
      LEFT JOIN municipios m ON s.id_municipio = m.id
      LEFT JOIN frecuencia_producto fp ON s.id_frecuencia = fp.id
      WHERE s.id_empresa = $1
      ORDER BY s.fecha_registro DESC
    `

    const result = await pool.query(query, [req.empresaId])
    return res.json({ ok: true, subproductos: result.rows })
  } catch (error) {
    next(error)
  }
}

export async function getSubproductoById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, error: 'ID de subproducto inválido' })
    }

    const query = `
      SELECT s.*,
             fm.nombre AS familia_material,
             um.nombre AS unidad_medida,
             um.abreviatura AS unidad_medida_abreviatura,
             m.nombre AS municipio,
             fp.nombre AS frecuencia,
             e.nombre AS empresa_nombre,
             e.id_usuario AS empresa_usuario_id
      FROM subproductos s
      LEFT JOIN familias_material fm ON s.id_familia_material = fm.id
      LEFT JOIN unidades_medida um ON s.id_unidad_medida = um.id
      LEFT JOIN municipios m ON s.id_municipio = m.id
      LEFT JOIN frecuencia_producto fp ON s.id_frecuencia = fp.id
      LEFT JOIN empresas e ON s.id_empresa = e.id
      WHERE s.id = $1
    `

    const result = await pool.query(query, [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Subproducto no encontrado' })
    }

    return res.json({ ok: true, subproducto: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function updateSubproducto(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' })

    if (!req.empresaId) {
      return res.status(403).json({ ok: false, error: 'Debes pertenecer a una empresa' })
    }

    // Verificar propiedad
    const existing = await pool.query('SELECT * FROM subproductos WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Subproducto no encontrado' })
    }
    if (Number(existing.rows[0].id_empresa) !== req.empresaId) {
      return res.status(403).json({
        ok: false,
        error: 'No tienes permiso para modificar este subproducto.',
      })
    }

    const body = patchSubproductoSchema.parse(req.body)

    let newFotoUrl = existing.rows[0].foto_url
    if (body.image_base64) {
      if (existing.rows[0].foto_url) {
        await deleteImage(existing.rows[0].foto_url)
      }
      newFotoUrl = await uploadImage(body.image_base64)
    } else if (body.foto_url !== undefined) {
      newFotoUrl = body.foto_url
    }

    const idFamilia = body.id_familia_material
      ? await resolveCatalogId('familias_material', body.id_familia_material)
      : existing.rows[0].id_familia_material

    const idUnidad = body.id_unidad_medida
      ? await resolveCatalogId('unidades_medida', body.id_unidad_medida)
      : existing.rows[0].id_unidad_medida

    const idMunicipio = body.id_municipio
      ? await resolveCatalogId('municipios', body.id_municipio)
      : existing.rows[0].id_municipio

    const idFrecuencia = body.id_frecuencia !== undefined
      ? (body.id_frecuencia ? await resolveCatalogId('frecuencia_producto', body.id_frecuencia) : null)
      : existing.rows[0].id_frecuencia

    const query = `
      UPDATE subproductos
      SET nombre = COALESCE($1, nombre),
          descripcion = COALESCE($2, descripcion),
          id_familia_material = $3,
          volumen_disponible = COALESCE($4, volumen_disponible),
          id_unidad_medida = $5,
          id_municipio = $6,
          direccion = COALESCE($7, direccion),
          precio_inicial = COALESCE($8, precio_inicial),
          id_frecuencia = $9,
          foto_url = $10,
          disponible = COALESCE($11, disponible)
      WHERE id = $12
      RETURNING *
    `

    const values = [
      body.nombre || null,
      body.descripcion || null,
      idFamilia,
      body.volumen_disponible || null,
      idUnidad,
      idMunicipio,
      body.direccion || null,
      body.precio_inicial !== undefined ? body.precio_inicial : null,
      idFrecuencia,
      newFotoUrl,
      body.disponible !== undefined ? body.disponible : null,
      id,
    ]

    const result = await pool.query(query, values)

    return res.json({
      ok: true,
      mensaje: 'Subproducto actualizado exitosamente',
      subproducto: result.rows[0],
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteSubproducto(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) return res.status(400).json({ ok: false, error: 'ID inválido' })

    if (!req.empresaId) {
      return res.status(403).json({ ok: false, error: 'Acceso denegado.' })
    }

    const existing = await pool.query('SELECT * FROM subproductos WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Subproducto no encontrado' })
    }
    if (Number(existing.rows[0].id_empresa) !== req.empresaId) {
      return res.status(403).json({ ok: false, error: 'No eres el propietario de este subproducto.' })
    }

    if (existing.rows[0].foto_url) {
      await deleteImage(existing.rows[0].foto_url)
    }

    await pool.query('DELETE FROM subproductos WHERE id = $1', [id])

    return res.json({ ok: true, mensaje: 'Subproducto eliminado exitosamente' })
  } catch (error) {
    next(error)
  }
}
