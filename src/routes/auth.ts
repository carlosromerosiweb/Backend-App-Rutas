import { Router } from 'express';
import * as authController from '../controllers/auth';
import { authenticate } from '../middlewares/auth';

const router = Router();

/**
 * @route POST /register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', authController.register);

/**
 * @route POST /login
 * @desc Login user
 * @access Public
 */
router.post('/login', authController.login);

/**
 * @route POST /logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route GET /me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @route PUT /api/auth/change-password
 * @desc Cambia la contraseña del usuario actual
 * @access Private
 */
router.put('/change-password', authenticate, authController.changePassword);

export default router;
