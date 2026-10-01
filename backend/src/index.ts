import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './config/auth'
import { env } from './config/env'
import { errorHandler } from './middlewares/errorHandler'

import usuariosRouter from './routes/usuarios.routes'
import empresasRouter from './routes/empresas.routes'
import personasRouter from './routes/personas.routes'
import subproductosRouter from './routes/subproductos.routes'
import catalogoRouter from './routes/catalogo.routes'
import stripeRouter from './routes/stripe.routes'
import intercambiosRouter from './routes/intercambios.routes'
import chatRouter from './routes/chat.routes'

const app = express()

const allowedOrigins = env.FRONTEND_URL.split(',').map((o) => o.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true)
      }
      if (env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true)
      }
      return callback(null, false)
    },
    credentials: true,
  })
)

app.use(cookieParser())

// Better-Auth endpoints (/api/auth/*)
app.all('/api/auth/*', toNodeHandler(auth))

// Stripe webhook requiere raw body (se procesa antes de json middleware para el webhook)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '10mb' }))

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ service: 'ecora-backend', status: 'ok' })
})

// Rutas API del dominio
app.use('/api/usuarios', usuariosRouter)
app.use('/api/empresas', empresasRouter)
app.use('/api/personas', personasRouter)
app.use('/api/subproductos', subproductosRouter)
app.use('/api/catalogo', catalogoRouter)
app.use('/api/stripe', stripeRouter)
app.use('/api/intercambios', intercambiosRouter)
app.use('/api/conversaciones', chatRouter)

// Global Error Handler
app.use(errorHandler)

// Evitar que excepciones no capturadas (ej. Better Auth schema validation) maten el proceso
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection (ignorado para mantener el proceso vivo):', reason)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (ignorado para mantener el proceso vivo):', err)
})

app.listen(env.PORT, () => {
  console.log(`🚀 ecora-backend escuchando en puerto ${env.PORT}`)
})
