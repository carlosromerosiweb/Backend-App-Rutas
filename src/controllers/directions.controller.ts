import { Request, Response } from 'express';
import { DirectionsService } from '../services/directions.service';
import { z } from 'zod';

const routeOptimizationSchema = z.object({
  date: z.string().optional(),
  origin_lat: z.number().optional(),
  origin_lng: z.number().optional(),
});

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
      if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'comercial' && requestingUserId !== userId) {
        res.status(403).json({
          error: 'No tienes permiso para acceder a esta ruta'
        });
        return;
      }

      // Validar parámetros de entrada
      const params = routeOptimizationSchema.parse(req.query);

      const route = await this.directionsService.getOptimizedRoute(
        userId,
        userRole || 'comercial', // Si no hay rol, asumimos comercial
        params.date,
        params.origin_lat,
        params.origin_lng
      );

      res.json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Parámetros inválidos', details: error.errors });
        return;
      }
      console.error('Error al obtener ruta optimizada:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  };

  getTeamOptimizedRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userRole = req.user?.role;

      // Verificar permisos
      if (userRole !== 'admin' && userRole !== 'manager') {
        res.status(403).json({
          error: 'No tienes permiso para acceder a esta ruta'
        });
        return;
      }

      // Validar parámetros de entrada
      const params = routeOptimizationSchema.parse(req.query);

      const routes = await this.directionsService.getTeamOptimizedRoutes(
        teamId,
        params.date
      );

      res.json(routes);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Parámetros inválidos', details: error.errors });
        return;
      }
      console.error('Error al obtener rutas optimizadas del equipo:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  };

  getWalkingOptimizedRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user?.userId;
      const userRole = req.user?.role;

      // Verificar permisos
      if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'comercial' && requestingUserId !== userId) {
        res.status(403).json({
          error: 'No tienes permiso para acceder a esta ruta'
        });
        return;
      }

      // Validar parámetros de entrada
      const params = routeOptimizationSchema.parse(req.query);

      const route = await this.directionsService.getWalkingOptimizedRoute(
        userId,
        userRole || 'comercial', // Si no hay rol, asumimos comercial
        params.date,
        params.origin_lat,
        params.origin_lng
      );

      res.json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Parámetros inválidos', details: error.errors });
        return;
      }
      console.error('Error al obtener ruta optimizada a pie:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  };

  getTeamWalkingOptimizedRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userRole = req.user?.role;

      // Verificar permisos
      if (userRole !== 'admin' && userRole !== 'manager') {
        res.status(403).json({
          error: 'No tienes permiso para acceder a esta ruta'
        });
        return;
      }

      // Validar parámetros de entrada
      const params = routeOptimizationSchema.parse(req.query);

      const routes = await this.directionsService.getTeamWalkingOptimizedRoutes(
        teamId,
        params.date
      );

      res.json(routes);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Parámetros inválidos', details: error.errors });
        return;
      }
      console.error('Error al obtener rutas optimizadas a pie del equipo:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      });
    }
  };
} 