import { Router } from 'express';
import { GamificationController } from '../controllers/gamification.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const gamificationController = new GamificationController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener top 10 usuarios con más puntos
router.get('/rankings', gamificationController.getRankings.bind(gamificationController));

// Obtener logros de un usuario específico
router.get('/logros/:user_id', gamificationController.getUserBadges.bind(gamificationController));

// Obtener resumen de gamificación del usuario autenticado
router.get('/summary', gamificationController.getGamificationSummary.bind(gamificationController));

export default router; 