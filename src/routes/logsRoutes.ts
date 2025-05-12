import { Router } from 'express';
import { getLogs, getLogById, searchLogs } from '../controllers/logsController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(authorize(['admin']));

// Buscar logs con filtros (esta ruta debe ir antes de /:id para evitar conflictos)
router.get('/search', searchLogs);

// Obtener todos los logs con paginación
router.get('/', getLogs);

// Obtener un log específico por ID
router.get('/:id', getLogById);

export default router; 