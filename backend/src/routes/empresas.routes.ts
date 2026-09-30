import { Router } from 'express'
import { createEmpresa } from '../controllers/empresas.controller'
import { requireAuth } from '../middlewares/requireAuth'

const router = Router()
router.post('/', requireAuth, createEmpresa)
export default router
