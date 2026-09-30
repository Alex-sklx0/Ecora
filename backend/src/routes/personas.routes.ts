import { Router } from 'express'
import { createPersona } from '../controllers/personas.controller'
import { requireAuth } from '../middlewares/requireAuth'

const router = Router()
router.post('/', requireAuth, createPersona)
export default router
