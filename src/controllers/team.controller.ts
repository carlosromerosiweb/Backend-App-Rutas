import { Request, Response } from 'express';
import { teamService } from '../services/team.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Esquemas de validación
const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

const updateTeamSchema = createTeamSchema.partial();

const assignUsersSchema = z.object({
  user_ids: z.array(z.number()),
});

export class TeamController {
  /**
   * Crea un nuevo equipo
   */
  public async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createTeamSchema.parse(req.body);
      const userId = parseInt(req.user?.id as string);
      const team = await teamService.createTeam(validatedData, userId);
      res.status(201).json(team);
    } catch (error) {
      logger.error('Error en createTeam:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  }

  /**
   * Obtiene todos los equipos
   */
  public async getTeams(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const result = await teamService.getTeams(page, limit);
      res.json(result);
    } catch (error) {
      logger.error('Error en getTeams:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene un equipo por su ID
   */
  public async getTeamById(req: Request, res: Response): Promise<void> {
    try {
      const teamId = parseInt(req.params.team_id);
      const team = await teamService.getTeamById(teamId);
      
      if (!team) {
        res.status(404).json({ error: 'Equipo no encontrado' });
        return;
      }

      res.json(team);
    } catch (error) {
      logger.error('Error en getTeamById:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Actualiza un equipo
   */
  public async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const teamId = parseInt(req.params.team_id);
      const validatedData = updateTeamSchema.parse(req.body);
      const userId = parseInt(req.user?.id as string);
      
      const team = await teamService.updateTeam(teamId, validatedData, userId);
      
      if (!team) {
        res.status(404).json({ error: 'Equipo no encontrado' });
        return;
      }

      res.json(team);
    } catch (error) {
      logger.error('Error en updateTeam:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  }

  /**
   * Elimina un equipo
   */
  public async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const teamId = parseInt(req.params.team_id);
      const userId = parseInt(req.user?.id as string);
      const success = await teamService.deleteTeam(teamId, userId);
      
      if (!success) {
        res.status(404).json({ error: 'Equipo no encontrado' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      logger.error('Error en deleteTeam:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Obtiene los miembros de un equipo
   */
  public async getTeamMembers(req: Request, res: Response): Promise<void> {
    try {
      const teamId = parseInt(req.params.team_id);
      const members = await teamService.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      logger.error('Error en getTeamMembers:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * Asigna usuarios a un equipo
   */
  public async assignUsersToTeam(req: Request, res: Response): Promise<void> {
    try {
      const teamId = parseInt(req.params.team_id);
      const validatedData = assignUsersSchema.parse(req.body);
      const userId = parseInt(req.user?.id as string);
      
      const success = await teamService.assignUsersToTeam(
        teamId,
        validatedData.user_ids,
        userId
      );
      
      if (!success) {
        res.status(404).json({ error: 'Equipo no encontrado' });
        return;
      }

      res.status(200).json({ message: 'Usuarios asignados correctamente' });
    } catch (error) {
      logger.error('Error en assignUsersToTeam:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  }
}

export const teamController = new TeamController(); 