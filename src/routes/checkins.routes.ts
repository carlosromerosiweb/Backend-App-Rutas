import { Router, RequestHandler } from 'express';
import { createCheckin, getCheckins, getCheckinsByLead } from '../controllers/checkins.controller';
import { authenticate } from '../middlewares/auth';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de check-ins
router.post('/', createCheckin as RequestHandler);
router.get('/', getCheckins as RequestHandler);
router.get('/lead/:leadId', getCheckinsByLead as RequestHandler);

export default router; 