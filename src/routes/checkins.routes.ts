import { Router, RequestHandler } from 'express';
import { createCheckin, getCheckins, getCheckinsByLead, autoCheckIn } from '../controllers/checkins.controller';
import { authenticate } from '../middlewares/auth';
import { upload } from '../services/file.service';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de check-ins manuales
router.post('/', upload.array('files', 5), createCheckin as RequestHandler);
router.get('/lead/:leadId', getCheckinsByLead as RequestHandler);
router.get('/', getCheckins as RequestHandler);

// Ruta para check-in automático con soporte para archivos
router.post('/auto', upload.array('files', 5), autoCheckIn as RequestHandler);

export default router; 