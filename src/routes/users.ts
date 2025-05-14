import { Router } from 'express';
import { getUsers, getUserById, deleteUser, updateUserRole } from '../controllers/users';
import { authenticate } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';

const router = Router();

// Obtener todos los usuarios (requiere autenticación)
router.get('/', authenticate, getUsers);

// Obtener un usuario específico por ID (requiere autenticación)
router.get('/:id', authenticate, getUserById);

// Eliminar un usuario específico por ID (requiere autenticación)
router.delete('/:id', authenticate, deleteUser);

// Actualizar rol de usuario (solo admin)
router.put(
  '/:id/role',
  authenticate,
  checkRole(['admin']),
  updateUserRole
);

export default router; 