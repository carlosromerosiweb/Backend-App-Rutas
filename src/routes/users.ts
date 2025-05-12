import { Router } from 'express';
import { getUsers } from '../controllers/users';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Obtener todos los usuarios (requiere autenticación)
router.get('/', authenticate, getUsers);

export default router; 