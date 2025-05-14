import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { checkRole } from '../middlewares/checkRole';
import { updateUserRole } from '../controllers/users';

const router = Router();

// Actualizar rol de usuario (solo admin)
router.put(
  '/:id/role',
  authenticate,
  checkRole(['admin']),
  updateUserRole
);

export default router; 