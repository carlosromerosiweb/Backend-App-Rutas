import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate } from '../middlewares/auth';
import { validateRole } from '../middlewares/role-validation';

const router = Router();
const usersController = new UsersController();

// Obtener todos los usuarios (solo admin)
router.get('/', authenticate, validateRole(['admin']), usersController.getUsers);

// Obtener usuario por ID
router.get('/:id', authenticate, usersController.getUserById);

export default router; 