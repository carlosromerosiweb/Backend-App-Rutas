import { Request, Response } from 'express';
import { DirectionsService } from '../services/directions.service';

export class DirectionsController {
  private directionsService: DirectionsService;

  constructor() {
    this.directionsService = new DirectionsService();
  }

  getOptimizedRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user?.userId;
      const userRole = req.user?.role;

      // Verificar permisos
      if (userRole !== 'admin' && userRole !== 'manager' && requestingUserId !== userId) {
        res.status(403).json({
          error: 'No tienes permiso para acceder a esta ruta'
        });
        return;
      }

      const route = await this.directionsService.getOptimizedRoute(userId);
      res.json(route);
    } catch (error) {
      console.error('Error al obtener ruta optimizada:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  };
} 