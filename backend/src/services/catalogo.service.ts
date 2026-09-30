import { pool } from '../config/db'

export async function resolveCatalogId(
  table: 'familias_material' | 'unidades_medida' | 'municipios' | 'frecuencia_producto',
  val: string | number | undefined | null
): Promise<number | null> {
  if (val === undefined || val === null || val === '') return null

  if (typeof val === 'number' || !isNaN(Number(val))) {
    const idNum = Number(val)
    const res = await pool.query(`SELECT id FROM ${table} WHERE id = $1`, [idNum])
    if (res.rows.length === 0) {
      throw new Error(`El ID ${idNum} no existe en la tabla ${table}.`)
    }
    return idNum
  }

  // Si es texto
  const strVal = String(val).trim()
  const res = await pool.query(`SELECT id FROM ${table} WHERE nombre ILIKE $1 LIMIT 1`, [
    `%${strVal}%`,
  ])

  if (res.rows.length === 0) {
    throw new Error(`El valor '${strVal}' no coincide con ningún registro en ${table}.`)
  }

  return Number(res.rows[0].id)
}
