import { Router } from 'express'
import { requireAuth } from '../middlewares/requireAuth'
import {
  getConversaciones,
  crearConversacion,
  getMensajes,
  enviarMensaje,
  marcarLeidos,
} from '../controllers/chat.controller'

const router = Router()

router.use(requireAuth)

router.get('/', getConversaciones)
router.post('/', crearConversacion)
router.get('/:id/mensajes', getMensajes)
router.post('/:id/mensajes', enviarMensaje)
router.patch('/:id/mensajes/leidos', marcarLeidos)

export default router
