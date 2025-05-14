import { Request, Response } from 'express';
import { RouteService } from '../services/route.service';
import { CreateRouteDto, UpdateRouteDto, AssignUserDto, AssignLeadsDto } from '../types/route.types';
import { logger } from '../utils/logger';

export class RouteController {
  private routeService: RouteService;

  constructor() {
    this.routeService = new RouteService();
  }

  createRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const input: CreateRouteDto = req.body;
      const userId = parseInt(req.user?.id as string);

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'ID de usuario inválido'
        });
        return;
      }

      const route = await this.routeService.createRoute(input, userId);
      res.status(201).json({
        success: true,
        data: route
      });
    } catch (error) {
      logger.error('Error en createRoute:', error);
      res.status(500).json({
        success: false,
        error: 'Error al crear la ruta'
      });
    }
  };

  getRoutesByTeam = async (req: Request, res: Response): Promise<void> => {
    try {
      const teamId = parseInt(req.params.team_id);
      
      if (isNaN(teamId)) {
        res.status(400).json({
          success: false,
          error: 'ID de equipo inválido'
        });
        return;
      }

      const routes = await this.routeService.getRoutesByTeam(teamId);
      res.json({
        success: true,
        data: routes
      });
    } catch (error) {
      logger.error('Error en getRoutesByTeam:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener las rutas del equipo'
      });
    }
  };

  updateRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const routeId = parseInt(req.params.route_id);
      const input: UpdateRouteDto = req.body;
      const userId = parseInt(req.user?.id as string);

      if (isNaN(routeId)) {
        res.status(400).json({
          success: false,
          error: 'ID de ruta inválido'
        });
        return;
      }

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'ID de usuario inválido'
        });
        return;
      }

      const route = await this.routeService.updateRoute(routeId, input, userId);
      res.json({
        success: true,
        data: route
      });
    } catch (error) {
      logger.error('Error en updateRoute:', error);
      res.status(500).json({
        success: false,
        error: 'Error al actualizar la ruta'
      });
    }
  };

  deleteRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const routeId = parseInt(req.params.route_id);
      const userId = parseInt(req.user?.id as string);

      if (isNaN(routeId)) {
        res.status(400).json({
          success: false,
          error: 'ID de ruta inválido'
        });
        return;
      }

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'ID de usuario inválido'
        });
        return;
      }

      await this.routeService.deleteRoute(routeId, userId);
      res.json({
        success: true,
        message: 'Ruta eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error en deleteRoute:', error);
      res.status(500).json({
        success: false,
        error: 'Error al eliminar la ruta'
      });
    }
  };

  assignUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const routeId = parseInt(req.params.route_id);
      const input: AssignUserDto = req.body;
      const userId = parseInt(req.user?.id as string);

      if (isNaN(routeId)) {
        res.status(400).json({
          success: false,
          error: 'ID de ruta inválido'
        });
        return;
      }

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'ID de usuario inválido'
        });
        return;
      }

      await this.routeService.assignUser(routeId, input, userId);
      res.json({
        success: true,
        message: 'Usuario asignado exitosamente'
      });
    } catch (error) {
      logger.error('Error en assignUser:', error);
      res.status(500).json({
        success: false,
        error: 'Error al asignar usuario a la ruta'
      });
    }
  };

  assignLeads = async (req: Request, res: Response): Promise<void> => {
    try {
      const routeId = parseInt(req.params.route_id);
      const input: AssignLeadsDto = req.body;
      const userId = parseInt(req.user?.id as string);

      if (isNaN(routeId)) {
        res.status(400).json({
          success: false,
          error: 'ID de ruta inválido'
        });
        return;
      }

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'ID de usuario inválido'
        });
        return;
      }

      await this.routeService.assignLeads(routeId, input, userId);
      res.json({
        success: true,
        message: 'Leads asignados exitosamente'
      });
    } catch (error) {
      logger.error('Error en assignLeads:', error);
      res.status(500).json({
        success: false,
        error: 'Error al asignar leads a la ruta'
      });
    }
  };

  getRouteLeads = async (req: Request, res: Response): Promise<void> => {
    try {
      const routeId = parseInt(req.params.route_id);
      
      if (isNaN(routeId)) {
        res.status(400).json({
          success: false,
          error: 'ID de ruta inválido'
        });
        return;
      }

      const leads = await this.routeService.getRouteLeads(routeId);
      res.json({
        success: true,
        data: leads
      });
    } catch (error) {
      logger.error('Error en getRouteLeads:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener los leads de la ruta'
      });
    }
  };

  getRouteUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const routeId = parseInt(req.params.route_id);
      
      if (isNaN(routeId)) {
        res.status(400).json({
          success: false,
          error: 'ID de ruta inválido'
        });
        return;
      }

      const users = await this.routeService.getRouteUsers(routeId);
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      logger.error('Error en getRouteUsers:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener los usuarios de la ruta'
      });
    }
  };
} 