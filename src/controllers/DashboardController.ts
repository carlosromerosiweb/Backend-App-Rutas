import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { AppError } from '../utils/AppError';
import { JwtPayload } from '../types';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getOverview = async (req: Request, res: Response) => {
    try {
      const user = req.user as JwtPayload;
      
      if (!user || !user.userId) {
        throw new AppError('Usuario no autenticado', 401);
      }

      const overview = await this.dashboardService.getOverview(parseInt(user.userId, 10));
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Error en getOverview:', error);
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor'
        });
      }
    }
  };
} 