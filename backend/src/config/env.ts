import dotenv from 'dotenv'
import path from 'path'
import { z } from 'zod'

// Cargar .env desde la raíz del proyecto o desde la carpeta actual
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '../.env') })

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(16).default('ecora_secret_default_key_32chars_long'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:8000'),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().default('http://localhost:5173'),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_CURRENCY: z.string().default('cop'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
