import { Response, NextFunction } from 'express'
import Stripe from 'stripe'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'
import { stripe } from '../config/stripe'
import { env } from '../config/env'
import { z } from 'zod'

export const MIN_CHECKOUT_COP = 4000

const checkoutSchema = z.object({
  id_subproducto: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0.'),
  direccion_entrega: z.string().trim().max(200).optional(),
})

export async function createCheckoutSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const buyerUserId = req.user!.id
    const body = checkoutSchema.parse(req.body)

    const subRes = await pool.query(
      `SELECT s.*, e.id_usuario AS id_usuario_vendedor
       FROM subproductos s
       JOIN empresas e ON s.id_empresa = e.id
       WHERE s.id = $1`,
      [body.id_subproducto]
    )

    if (subRes.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Subproducto no encontrado.' })
    }

    const subproducto = subRes.rows[0]

    const stock = Number(subproducto.volumen_disponible)
    if (!subproducto.disponible || stock <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'Este subproducto ya no se encuentra disponible.',
      })
    }

    if (body.cantidad > stock) {
      return res.status(400).json({
        ok: false,
        error: 'La cantidad supera el stock disponible.',
      })
    }

    const precioFinal = Number(subproducto.precio_inicial) * body.cantidad
    if (precioFinal < MIN_CHECKOUT_COP) {
      return res.status(400).json({
        ok: false,
        error: 'El monto total debe ser de al menos 4.000 COP para procesar el pago.',
      })
    }

    if (subproducto.id_usuario_vendedor === buyerUserId) {
      return res.status(403).json({
        ok: false,
        error: 'No puedes comprar tu propio subproducto.',
      })
    }

    let stripeCustomerId: string | undefined = undefined
    const empUser = await pool.query(
      'SELECT stripe_customer_id FROM empresas WHERE id_usuario = $1',
      [buyerUserId]
    )
    if (empUser.rows.length > 0 && empUser.rows[0].stripe_customer_id) {
      stripeCustomerId = empUser.rows[0].stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        name: req.user!.name,
        metadata: { userId: buyerUserId },
      })
      stripeCustomerId = customer.id

      if (empUser.rows.length > 0) {
        await pool.query('UPDATE empresas SET stripe_customer_id = $1 WHERE id_usuario = $2', [
          stripeCustomerId,
          buyerUserId,
        ])
      }
    }

    const unitAmount = Math.round(precioFinal * 100)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : req.user!.email,
      line_items: [
        {
          price_data: {
            currency: env.STRIPE_CURRENCY,
            product_data: {
              name: subproducto.nombre,
              description: subproducto.descripcion || undefined,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${env.FRONTEND_URL}/pago/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/pago/cancelado`,
      metadata: {
        id_subproducto: String(subproducto.id),
        id_usuario_comprador: buyerUserId,
        id_usuario_vendedor: subproducto.id_usuario_vendedor,
        precio_final: String(precioFinal),
        cantidad: String(body.cantidad),
        ...(body.direccion_entrega ? { direccion_entrega: body.direccion_entrega } : {}),
      },
      payment_intent_data: {
        metadata: {
          id_subproducto: String(subproducto.id),
          id_usuario_comprador: buyerUserId,
          id_usuario_vendedor: subproducto.id_usuario_vendedor,
        },
      },
    })

    return res.json({ ok: true, url: session.url })
  } catch (error) {
    next(error)
  }
}

const confirmSchema = z.object({
  session_id: z.string().trim().min(1),
})

type PagoConfirmado = {
  idSubproducto: number
  buyerId: string
  sellerId: string
  precioFinal: number
  stripeSessionId: string
  paymentIntentId: string | null
  direccionEntrega: string | null
  cantidad: number
}

function pagoDesdeSesion(session: Stripe.Checkout.Session): PagoConfirmado | null {
  const metadata = session.metadata || {}
  const idSubproducto = Number(metadata.id_subproducto)
  const buyerId = metadata.id_usuario_comprador
  const sellerId = metadata.id_usuario_vendedor
  if (!idSubproducto || !buyerId || !sellerId) return null

  return {
    idSubproducto,
    buyerId,
    sellerId,
    precioFinal: Number(metadata.precio_final || (session.amount_total ?? 0) / 100),
    stripeSessionId: session.id,
    paymentIntentId: session.payment_intent ? String(session.payment_intent) : null,
    direccionEntrega: metadata.direccion_entrega || null,
    cantidad: Number(metadata.cantidad) > 0 ? Number(metadata.cantidad) : 0,
  }
}

export async function registrarPagoConfirmado(pago: PagoConfirmado) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT id FROM subproductos WHERE id = $1 FOR UPDATE', [pago.idSubproducto])

    const inserted = await client.query(
      `INSERT INTO intercambios (
         id_subproducto, id_usuario_comprador, id_usuario_vendedor,
         fecha_intercambio, precio_final, stripe_session_id,
         stripe_payment_intent_id, estado_pago, direccion_entrega, cantidad
       )
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, 'pagado', $7, $8)
       ON CONFLICT (stripe_session_id) DO NOTHING
       RETURNING id`,
      [
        pago.idSubproducto,
        pago.buyerId,
        pago.sellerId,
        pago.precioFinal,
        pago.stripeSessionId,
        pago.paymentIntentId,
        pago.direccionEntrega,
        pago.cantidad,
      ]
    )

    if ((inserted.rowCount ?? 0) > 0 && pago.cantidad > 0) {
      const updated = await client.query(
        `UPDATE subproductos
         SET volumen_disponible = GREATEST(volumen_disponible - $2, 0),
             disponible = (volumen_disponible - $2) > 0
         WHERE id = $1 AND volumen_disponible >= $2
         RETURNING id`,
        [pago.idSubproducto, pago.cantidad]
      )
      if ((updated.rowCount ?? 0) === 0) {
        throw new Error('No hay stock suficiente para registrar este intercambio.')
      }
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function confirmCheckoutSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { session_id: sessionId } = confirmSchema.parse(req.body)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ ok: false, error: 'El pago aún no está confirmado en Stripe.' })
    }

    const pago = pagoDesdeSesion(session)
    if (!pago) {
      return res.status(400).json({ ok: false, error: 'La sesión de pago no tiene los datos del intercambio.' })
    }

    await registrarPagoConfirmado(pago)
    return res.json({ ok: true })
  } catch (error) {
    next(error)
  }
}

export async function handleStripeWebhook(req: AuthenticatedRequest, res: Response) {
  const sig = req.headers['stripe-signature']

  if (!sig) {
    return res.status(400).json({ ok: false, error: 'Falta encabezado Stripe-Signature' })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'firma inválida'
    console.error('Error de verificación de firma Webhook Stripe:', message)
    return res.status(400).send(`Webhook Error: ${message}`)
  }

  try {
    console.log(`Stripe webhook recibido: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
      const pago = pagoDesdeSesion(event.data.object)
      if (pago) await registrarPagoConfirmado(pago)
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      if (session.id) {
        await pool.query(
          "UPDATE intercambios SET estado_pago = 'fallido' WHERE stripe_session_id = $1",
          [session.id]
        )
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object
      await pool.query(
        "UPDATE intercambios SET estado_pago = 'fallido' WHERE stripe_payment_intent_id = $1",
        [paymentIntent.id]
      )
    }

    return res.json({ received: true })
  } catch (err) {
    console.error('Error procesando evento webhook Stripe:', err)
    return res.json({ received: true })
  }
}
