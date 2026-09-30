import { Router } from 'express'
import { getIntercambios, getIntercambioById } from '../controllers/intercambios.controller'
import { requireAuth } from '../middlewares/requireAuth'

const router = Router()

router.get('/', requireAuth, getIntercambios)
router.get('/:id', requireAuth, getIntercambioById)

export default router
