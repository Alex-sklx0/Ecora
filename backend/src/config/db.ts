import { Pool } from 'pg'
import { env } from './env'

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
})

pool.on('error', (err: any) => {
  if (err?.message?.includes('Connection terminated') || err?.code === 'ECONNRESET') {
    return
  }
  console.warn('Advertencia en cliente PostgreSQL inactivo:', err?.message || err)
})
