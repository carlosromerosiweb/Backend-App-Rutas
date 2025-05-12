import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { setFollowUp, getTodayFollowUps } from '../controllers/followups.controller';
import { RequestHandler } from 'express';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Establecer fecha de seguimiento para un lead
router.patch('/leads/:id/follow-up', setFollowUp as RequestHandler);

// Obtener seguimientos programados para hoy
router.get('/today', getTodayFollowUps as RequestHandler);

export default router; 