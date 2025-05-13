import { Request, Response } from 'express';
import { teamLogService } from '../services/team-log.service';
import { logger } from '../utils/logger';

export class TeamLogController {
  /**
   * Obtiene los logs de un equipo
   */
  public async getTeamLogs(req: Request, res: Response): Promise<void> {
    try {
      const teamId = parseInt(req.params.team_id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await teamLogService.getTeamLogs(teamId, page, limit);
      res.json(result);
    } catch (error) {
      logger.error('Error en getTeamLogs:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export const teamLogController = new TeamLogController(); 