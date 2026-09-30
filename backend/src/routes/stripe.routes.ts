import { Router } from 'express'
import {
  confirmCheckoutSession,
  createCheckoutSession,
  handleStripeWebhook,
} from '../controllers/stripe.controller'
import { requireAuth } from '../middlewares/requireAuth'

const router = Router()

router.post('/checkout', requireAuth, createCheckoutSession)
router.post('/confirm', requireAuth, confirmCheckoutSession)
router.post('/webhook', handleStripeWebhook)

export default router
