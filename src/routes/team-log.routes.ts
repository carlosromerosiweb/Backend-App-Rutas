import { Router } from 'express';
import { teamLogController } from '../controllers/team-log.controller';
import { teamAuthMiddleware } from '../middleware/team.middleware';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener logs de un equipo
router.get(
  '/:team_id/logs',
  teamAuthMiddleware,
  teamLogController.getTeamLogs.bind(teamLogController)
);

export default router; 