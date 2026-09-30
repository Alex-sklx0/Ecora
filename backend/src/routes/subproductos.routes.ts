import { Router } from 'express'
import {
  createSubproducto,
  uploadImageIsolated,
  getMisPublicaciones,
  getSubproductoById,
  updateSubproducto,
  deleteSubproducto,
} from '../controllers/subproductos.controller'
import { requireAuth } from '../middlewares/requireAuth'
import { optionalAuth } from '../middlewares/optionalAuth'

const router = Router()

router.post('/', requireAuth, createSubproducto)
router.post('/upload', requireAuth, uploadImageIsolated)
router.get('/mis-publicaciones', requireAuth, getMisPublicaciones)
router.get('/:id', optionalAuth, getSubproductoById)
router.patch('/:id', requireAuth, updateSubproducto)
router.delete('/:id', requireAuth, deleteSubproducto)

export default router
