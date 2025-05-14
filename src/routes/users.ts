import { Router } from 'express';
import { getUsers, getUserById, deleteUser } from '../controllers/users';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Obtener todos los usuarios (requiere autenticación)
router.get('/', authenticate, getUsers);

// Obtener un usuario específico por ID (requiere autenticación)
router.get('/:id', authenticate, getUserById);

// Eliminar un usuario específico por ID (requiere autenticación)
router.delete('/:id', authenticate, deleteUser);

export default router; 