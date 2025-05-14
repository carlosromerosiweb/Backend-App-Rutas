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

// Rutas que requieren rol admin o manager
router.get(
  '/',
  teamRoleMiddleware(['admin', 'manager']),
  teamController.getTeams.bind(teamController)
);

router.get(
  '/:team_id',
  teamRoleMiddleware(['admin', 'manager']),
  teamController.getTeamById.bind(teamController)
);

// Rutas que requieren permisos específicos del equipo
router.put(
  '/:team_id',
  teamRoleMiddleware(['admin']),
  teamAuthMiddleware,
  teamController.updateTeam.bind(teamController)
);

router.delete(
  '/:team_id',
  teamRoleMiddleware(['admin']),
  teamAuthMiddleware,
  teamController.deleteTeam.bind(teamController)
);

router.get(
  '/:team_id/members',
  teamRoleMiddleware(['admin', 'manager']),
  teamController.getTeamMembers.bind(teamController)
);

router.post(
  '/:team_id/users',
  teamRoleMiddleware(['admin', 'manager']),
  teamAuthMiddleware,
  teamController.assignUsersToTeam.bind(teamController)
);

// Rutas para gestionar leads del equipo
router.post(
  '/:team_id/leads',
  teamRoleMiddleware(['admin', 'manager']),
  teamAuthMiddleware,
  teamController.assignLeadsToTeam.bind(teamController)
);

router.get(
  '/:team_id/leads',
  teamRoleMiddleware(['admin', 'manager']),
  teamController.getTeamLeads.bind(teamController)
);

router.delete(
  '/:team_id/leads',
  teamRoleMiddleware(['admin', 'manager']),
  teamAuthMiddleware,
  teamController.removeLeadsFromTeam.bind(teamController)
);

export default router; 