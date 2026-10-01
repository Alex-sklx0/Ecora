import { Router } from 'express'
import { createEmpresa, getEmpresaById } from '../controllers/empresas.controller'
import { requireAuth } from '../middlewares/requireAuth'

const router = Router()
router.post('/', requireAuth, createEmpresa)
router.get('/:id', requireAuth, getEmpresaById)
export default router
