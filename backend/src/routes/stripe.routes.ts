import { Router } from 'express'
import { createCheckoutSession, handleStripeWebhook } from '../controllers/stripe.controller'
import { requireAuth } from '../middlewares/requireAuth'

const router = Router()

router.post('/checkout', requireAuth, createCheckoutSession)
router.post('/webhook', handleStripeWebhook)

export default router
