import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'
import { resolveCatalogId } from '../services/catalogo.service'

export async function getCatalogo(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { q, familia, municipio, precio_min, precio_max, frecuencia } = req.query

    const whereClauses: string[] = ['s.disponible = true']
    const params: any[] = []
    let paramIndex = 1

    if (q && String(q).trim()) {
      whereClauses.push(
        `(s.nombre ILIKE $${paramIndex} OR s.descripcion ILIKE $${paramIndex} OR e.nombre ILIKE $${paramIndex})`
      )
      params.push(`%${String(q).trim()}%`)
      paramIndex++
    }

    if (familia) {
      try {
        const idFam = await resolveCatalogId('familias_material', String(familia))
        if (idFam) {
          whereClauses.push(`s.id_familia_material = $${paramIndex}`)
          params.push(idFam)
          paramIndex++
        }
      } catch {
        // Si no encuentra el catálogo por filtro opcional, devuelve vacíos sin romper
        return res.json({ ok: true, subproductos: [] })
      }
    }

    if (municipio) {
      try {
        const idMun = await resolveCatalogId('municipios', String(municipio))
        if (idMun) {
          whereClauses.push(`s.id_municipio = $${paramIndex}`)
          params.push(idMun)
          paramIndex++
        }
      } catch {
        return res.json({ ok: true, subproductos: [] })
      }
    }

    if (frecuencia) {
      try {
        const idFrec = await resolveCatalogId('frecuencia_producto', String(frecuencia))
        if (idFrec) {
          whereClauses.push(`s.id_frecuencia = $${paramIndex}`)
          params.push(idFrec)
          paramIndex++
        }
      } catch {
        return res.json({ ok: true, subproductos: [] })
      }
    }

    if (precio_min && !isNaN(Number(precio_min))) {
      whereClauses.push(`s.precio_inicial >= $${paramIndex}`)
      params.push(Number(precio_min))
      paramIndex++
    }

    if (precio_max && !isNaN(Number(precio_max))) {
      whereClauses.push(`s.precio_inicial <= $${paramIndex}`)
      params.push(Number(precio_max))
      paramIndex++
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const query = `
      SELECT s.*,
             fm.nombre AS familia_material,
             um.nombre AS unidad_medida,
             um.abreviatura AS unidad_medida_abreviatura,
             m.nombre AS municipio,
             fp.nombre AS frecuencia,
             e.nombre AS empresa_nombre
      FROM subproductos s
      LEFT JOIN familias_material fm ON s.id_familia_material = fm.id
      LEFT JOIN unidades_medida um ON s.id_unidad_medida = um.id
      LEFT JOIN municipios m ON s.id_municipio = m.id
      LEFT JOIN frecuencia_producto fp ON s.id_frecuencia = fp.id
      LEFT JOIN empresas e ON s.id_empresa = e.id
      ${whereSql}
      ORDER BY s.fecha_registro DESC
    `

    const result = await pool.query(query, params)
    return res.json({ ok: true, subproductos: result.rows })
  } catch (error) {
    next(error)
  }
}

export async function getOpcionesCatalogo(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const [familias, unidades, municipios, frecuencias] = await Promise.all([
      pool.query('SELECT id, nombre FROM familias_material ORDER BY id'),
      pool.query('SELECT id, nombre, abreviatura FROM unidades_medida ORDER BY id'),
      pool.query('SELECT id, nombre FROM municipios ORDER BY id'),
      pool.query('SELECT id, nombre FROM frecuencia_producto ORDER BY id'),
    ])

    return res.json({
      ok: true,
      opciones: {
        familias: familias.rows,
        unidades: unidades.rows,
        municipios: municipios.rows,
        frecuencias: frecuencias.rows,
      },
    })
  } catch (error) {
    next(error)
  }
}
