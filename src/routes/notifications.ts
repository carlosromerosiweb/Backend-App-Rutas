/**
 * Rutas para la gestión de notificaciones
 */
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { 
  registerDeviceToken,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
  createNotification,
  registerTestToken
} from '../controllers/notifications';

const router = Router();

/**
 * @route POST /api/notifications/register-token
 * @desc Registra un token de dispositivo para recibir notificaciones
 * @access Private
 */
router.post('/register-token', authenticate, registerDeviceToken);

/**
 * @route GET /api/notifications
 * @desc Obtiene las notificaciones del usuario actual
 * @access Private
 */
router.get('/', authenticate, getUserNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Marca una notificación como leída
 * @access Private
 */
router.put('/:id/read', authenticate, markNotificationAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Elimina una notificación
 * @access Private
 */
router.delete('/:id', authenticate, deleteNotification);

/**
 * @route POST /api/notifications
 * @desc Crea una nueva notificación (solo admin/manager)
 * @access Private (Admin, Manager)
 */
router.post('/', authenticate, authorize(['admin', 'manager']), createNotification);

/**
 * @route POST /api/notifications/register-test-token
 * @desc Registra un token de prueba para desarrollo
 * @access Private
 */
router.post('/register-test-token', authenticate, registerTestToken);

export default router;