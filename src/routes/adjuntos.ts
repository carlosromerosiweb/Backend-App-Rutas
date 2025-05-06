import { Router } from 'express';
import { createAdjunto, getAdjuntosByLead } from '../controllers/adjuntos.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Subir un adjunto para un lead
router.post('/:leadId/adjuntos', createAdjunto);

// Listar todos los adjuntos de un lead
router.get('/:leadId/adjuntos', getAdjuntosByLead);

export default router; 