import { Request, Response } from 'express';
import { DirectionsService } from '../services/directions.service';
import { validateUserRole } from '../middlewares/authMiddleware';
import { z } from 'zod';

const routeOptimizationSchema = z.object({
  date: z.string().optional(),
  origin_lat: z.number().optional(),
  origin_lng: z.number().optional(),
});

export class RouteOptimizationController {
  private directionsService: DirectionsService;

  constructor() {
    this.directionsService = new DirectionsService();
  }

  public getOptimizedRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validar parámetros de entrada
      const params = routeOptimizationSchema.parse(req.query);
      
      // Obtener el usuario del token JWT
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      // Validar rol del usuario
      if (!validateUserRole(userRole, ['comercial', 'manager', 'admin'])) {
        res.status(403).json({ error: 'No tienes permisos para acceder a esta ruta' });
        return;
      }

      // Obtener la ruta optimizada usando el servicio de direcciones
      const optimizedRoute = await this.directionsService.getOptimizedRoute(
        userId,
        userRole,
        params.date,
        params.origin_lat,
        params.origin_lng
      );

      res.json(optimizedRoute);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Parámetros inválidos', details: error.errors });
        return;
      }
      console.error('Error al obtener ruta optimizada:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
} 