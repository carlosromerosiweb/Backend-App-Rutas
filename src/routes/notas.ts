import { Router } from 'express';
import { createNota, getNotasByLead } from '../controllers/notas.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear una nueva nota para un lead
router.post('/:leadId/notas', createNota);

// Listar todas las notas de un lead
router.get('/:leadId/notas', getNotasByLead);

export default router; 