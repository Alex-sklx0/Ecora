import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types'
import { pool } from '../config/db'
import { stripe } from '../config/stripe'
import { env } from '../config/env'
import { z } from 'zod'

const checkoutSchema = z.object({
  id_subproducto: z.coerce.number(),
  precio_final: z.coerce.number().positive(),
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

    if (!subproducto.disponible) {
      return res.status(400).json({
        ok: false,
        error: 'Este subproducto ya no se encuentra disponible.',
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

    const unitAmount = Math.round(body.precio_final * 100)

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
        precio_final: String(body.precio_final),
      },
    })

    return res.json({ ok: true, url: session.url })
  } catch (error) {
    next(error)
  }
}

export async function handleStripeWebhook(req: AuthenticatedRequest, res: Response) {
  const sig = req.headers['stripe-signature']

  if (!sig) {
    return res.status(400).json({ ok: false, error: 'Falta encabezado Stripe-Signature' })
  }

  let event: any
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Error de verificación de firma Webhook Stripe:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const metadata = session.metadata || {}

      const idSubproducto = Number(metadata.id_subproducto)
      const buyerId = metadata.id_usuario_comprador
      const sellerId = metadata.id_usuario_vendedor
      const precioFinal = Number(metadata.precio_final || session.amount_total / 100)
      const stripeSessionId = session.id
      const paymentIntentId = session.payment_intent ? String(session.payment_intent) : null

      if (idSubproducto && buyerId && sellerId) {
        await pool.query(
          `INSERT INTO intercambios (
             id_subproducto, id_usuario_comprador, id_usuario_vendedor,
             fecha_intercambio, precio_final, stripe_session_id,
             stripe_payment_intent_id, estado_pago
           )
           VALUES ($1, $2, $3, NOW(), $4, $5, $6, 'pagado')
           ON CONFLICT (stripe_session_id)
           DO UPDATE SET estado_pago = 'pagado', stripe_payment_intent_id = EXCLUDED.stripe_payment_intent_id`,
          [idSubproducto, buyerId, sellerId, precioFinal, stripeSessionId, paymentIntentId]
        )

        await pool.query('UPDATE subproductos SET disponible = false WHERE id = $1', [idSubproducto])
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      if (session.id) {
        await pool.query(
          "UPDATE intercambios SET estado_pago = 'fallido' WHERE stripe_session_id = $1",
          [session.id]
        )
      }
    }

    return res.json({ received: true })
  } catch (err) {
    console.error('Error procesando evento webhook Stripe:', err)
    return res.status(500).json({ ok: false, error: 'Error interno en webhook' })
  }
}
