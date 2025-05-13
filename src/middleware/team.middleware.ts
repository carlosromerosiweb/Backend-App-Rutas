import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';
import { logger } from '../utils/logger';

export const teamAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = parseInt(req.user?.id as string);
    const teamId = parseInt(req.params.team_id);

    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    if (!teamId) {
      res.status(400).json({ error: 'ID de equipo no válido' });
      return;
    }

    try {
      const canManage = await teamService.canManageTeam(userId, teamId);

      if (!canManage) {
        res.status(403).json({ error: 'No tienes permiso para gestionar este equipo' });
        return;
      }

      next();
    } catch (error: any) {
      if (error.message && error.message.includes('timeout')) {
        res.status(503).json({ error: 'Error de conexión con la base de datos. Por favor, intente nuevamente.' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    logger.error('Error en teamAuthMiddleware:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const teamRoleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
      return;
    }

    next();
  };
}; 