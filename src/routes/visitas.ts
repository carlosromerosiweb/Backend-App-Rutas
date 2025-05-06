import { Router } from 'express';
import { createVisita, getVisitas, getVisitaById, getVisitasByLead, getVisitasByUsuario } from '../controllers/visitas.controller';
import { authenticateToken, validateVisit } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear una nueva visita
router.post('/', validateVisit, createVisita);

// Listar todas las visitas (con filtros opcionales)
router.get('/', getVisitas);

// Obtener detalles de una visita
router.get('/:id', getVisitaById);

// Listar visitas de un lead
router.get('/lead/:leadId', getVisitasByLead);

// Listar visitas de un usuario
router.get('/usuario/:userId', getVisitasByUsuario);

export default router; 