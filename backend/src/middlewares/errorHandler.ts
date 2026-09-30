import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('API Error:', err)

  if (err instanceof ZodError) {
    const issue = err.issues[0]
    return res.status(400).json({
      ok: false,
      error: `Error de validación: ${issue.path.join('.')} - ${issue.message}`,
    })
  }

  // Errores de Postgres
  if (err.code) {
    switch (err.code) {
      case '23505':
        return res.status(409).json({
          ok: false,
          error: 'Ya existe un registro con esa información. Verifica los datos e intenta de nuevo.',
        })
      case '23503':
        return res.status(400).json({
          ok: false,
          error: 'No se encontró un registro relacionado.',
        })
      case '23502':
        return res.status(400).json({
          ok: false,
          error: 'Falta un campo obligatorio.',
        })
      case '23514':
        return res.status(400).json({
          ok: false,
          error: 'Los datos no cumplen con las restricciones del sistema.',
        })
      case 'PGRST116':
        return res.status(404).json({
          ok: false,
          error: 'El recurso solicitado no fue encontrado.',
        })
    }
  }

  // Errores de Stripe
  if (err.type && err.type.startsWith('Stripe')) {
    switch (err.code) {
      case 'card_declined':
        return res.status(400).json({
          ok: false,
          error: 'La tarjeta fue rechazada. Intenta con otro medio de pago.',
        })
      case 'expired_card':
        return res.status(400).json({
          ok: false,
          error: 'La tarjeta está vencida.',
        })
      default:
        return res.status(400).json({
          ok: false,
          error: err.message || 'No se pudo procesar el pago. Intenta de nuevo.',
        })
    }
  }

  const statusCode = err.status || err.statusCode || 500
  const message = err.message || 'Error interno del servidor.'
  return res.status(statusCode).json({ ok: false, error: message })
}
