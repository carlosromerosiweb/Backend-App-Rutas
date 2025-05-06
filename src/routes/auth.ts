import { Router } from 'express';
import { login, register, refreshToken } from '../controllers/auth.controller';
import { validateLogin, validateRegister } from '../middleware/auth.middleware';

const router = Router();

// Rutas de autenticación
router.post('/login', validateLogin, login);
router.post('/register', validateRegister, register);
router.post('/refresh-token', refreshToken);

export default router; 