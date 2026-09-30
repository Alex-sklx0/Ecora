import { Router } from 'express'
import { getCatalogo, getOpcionesCatalogo } from '../controllers/catalogo.controller'
import { optionalAuth } from '../middlewares/optionalAuth'

const router = Router()

router.get('/', optionalAuth, getCatalogo)
router.get('/opciones', optionalAuth, getOpcionesCatalogo)

export default router
