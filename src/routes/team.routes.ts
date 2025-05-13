import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { teamAuthMiddleware, teamRoleMiddleware } from '../middleware/team.middleware';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Rutas públicas (requieren autenticación)
router.use(authenticate);

// Rutas que requieren rol admin o manager
router.post(
  '/',
  teamRoleMiddleware(['admin', 'manager']),
  teamController.createTeam.bind(teamController)
);

router.get('/', teamController.getTeams.bind(teamController));

router.get(
  '/:team_id',
  teamController.getTeamById.bind(teamController)
);

// Rutas que requieren permisos específicos del equipo
router.put(
  '/:team_id',
  teamAuthMiddleware,
  teamController.updateTeam.bind(teamController)
);

router.delete(
  '/:team_id',
  teamAuthMiddleware,
  teamController.deleteTeam.bind(teamController)
);

router.get(
  '/:team_id/members',
  teamController.getTeamMembers.bind(teamController)
);

router.post(
  '/:team_id/users',
  teamAuthMiddleware,
  teamController.assignUsersToTeam.bind(teamController)
);

export default router; 