import { Request, Response } from 'express';
import { GamificationService } from '../services/gamification.service';
import { logger } from '../utils/logger';

const gamificationService = new GamificationService();

export class GamificationController {
  // Obtener top 10 usuarios con más puntos
  async getRankings(req: Request, res: Response): Promise<void> {
    try {
      const topUsers = await gamificationService.getTopUsers();
      res.json({
        success: true,
        data: topUsers
      });
    } catch (error) {
      logger.error('Error en getRankings:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener rankings'
      });
    }
  }

  // Obtener logros de un usuario
  async getUserBadges(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.user_id);
      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'ID de usuario inválido'
        });
        return;
      }

      const badges = await gamificationService.getUserBadges(userId);
      res.json({
        success: true,
        data: badges
      });
    } catch (error) {
      logger.error('Error en getUserBadges:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener logros del usuario'
      });
    }
  }

  // Obtener resumen de gamificación
  async getGamificationSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any).id;
      const summary = await gamificationService.getUserGamificationSummary(userId);
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error en getGamificationSummary:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener resumen de gamificación'
      });
    }
  }
} 