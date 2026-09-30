import { Router } from 'express'
import { getMe, deleteMe } from '../controllers/usuarios.controller'
import { requireAuth } from '../middlewares/requireAuth'

const router = Router()
router.get('/me', requireAuth, getMe)
router.delete('/me', requireAuth, deleteMe)
export default router
