import { Router } from 'express';
import { getHistorialByLead } from '../controllers/historial.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar historial de cambios de estado de un lead
router.get('/:leadId/historial-estados', getHistorialByLead);

export default router; 