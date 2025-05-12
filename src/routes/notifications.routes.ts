import { Router } from 'express';
import { sendNotification } from '../controllers/notifications.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

/**
 * @route POST /notifications/send
 * @desc Enviar notificación push (solo admin o manager)
 * @access Private
 */
router.post('/send', 
  authenticate, 
  authorize(['admin', 'manager']), 
  sendNotification
);

export default router; 