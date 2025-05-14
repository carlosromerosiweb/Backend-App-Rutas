import { Pool } from 'pg';
import pool from '../db';
import { logger } from '../utils/logger';
import { Team, TeamMember } from '../types';
import { z } from 'zod';
import { teamLogService, TeamAction } from './team-log.service';

// Esquemas de validación
const teamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

const teamMemberSchema = z.object({
  user_id: z.number(),
});

class TeamService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Crea un nuevo equipo
   */
  public async createTeam(data: z.infer<typeof teamSchema>, userId: number): Promise<Team> {
    try {
      const validatedData = teamSchema.parse(data);
      
      const query = `
        INSERT INTO teams (name, description)
        VALUES ($1, $2)
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        validatedData.name,
        validatedData.description || null
      ]);

      const team = result.rows[0];

      // Registrar la acción en los logs
      await teamLogService.logAction(
        team.id,
        userId,
        TeamAction.CREATE,
        { team_data: team }
      );

      return team;
    } catch (error) {
      logger.error('Error al crear equipo:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los equipos con paginación
   */
  public async getTeams(
    page: number = 1,
    limit: number = 20
  ): Promise<{ teams: Team[], total: number }> {
    try {
      const offset = (page - 1) * limit;

      const countQuery = 'SELECT COUNT(*) FROM teams';
      const countResult = await this.pool.query(countQuery);
      const total = parseInt(countResult.rows[0].count);

      const query = `
        SELECT *
        FROM teams
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await this.pool.query(query, [limit, offset]);
      
      return {
        teams: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error al obtener equipos:', error);
      throw error;
    }
  }

  /**
   * Obtiene un equipo por su ID
   */
  public async getTeamById(id: number): Promise<Team | null> {
    try {
      const query = `
        SELECT *
        FROM teams
        WHERE id = $1
      `;

      const result = await this.pool.query(query, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error al obtener equipo por ID:', error);
      throw error;
    }
  }

  /**
   * Actualiza un equipo
   */
  public async updateTeam(
    id: number,
    data: Partial<z.infer<typeof teamSchema>>,
    userId: number
  ): Promise<Team | null> {
    try {
      const validatedData = teamSchema.partial().parse(data);
      
      const setClause = Object.keys(validatedData)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const query = `
        UPDATE teams
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;

      const values = [id, ...Object.values(validatedData)];
      const result = await this.pool.query(query, values);
      
      const team = result.rows[0];

      if (team) {
        // Registrar la acción en los logs
        await teamLogService.logAction(
          team.id,
          userId,
          TeamAction.UPDATE,
          { 
            team_id: id,
            update_data: validatedData,
            updated_team: team
          }
        );
      }

      return team || null;
    } catch (error) {
      logger.error('Error al actualizar equipo:', error);
      throw error;
    }
  }

  /**
   * Elimina un equipo
   */
  public async deleteTeam(id: number, userId: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener información del equipo antes de eliminarlo
      const teamQuery = 'SELECT * FROM teams WHERE id = $1';
      const teamResult = await client.query(teamQuery, [id]);
      const team = teamResult.rows[0];

      if (!team) {
        await client.query('ROLLBACK');
        return false;
      }

      // Registrar la acción en los logs antes de eliminar
      await teamLogService.logAction(
        id,
        userId,
        TeamAction.DELETE,
        { deleted_team: team }
      );

      // Eliminar registros de logs del equipo
      await client.query(
        'DELETE FROM team_logs WHERE team_id = $1',
        [id]
      );

      // Liberar usuarios del equipo
      await client.query(
        'UPDATE users SET team_id = NULL WHERE team_id = $1',
        [id]
      );

      // Liberar leads del equipo
      await client.query(
        'UPDATE leads SET team_id = NULL WHERE team_id = $1',
        [id]
      );

      // Eliminar el equipo
      const deleteQuery = `
        DELETE FROM teams
        WHERE id = $1
      `;

      const result = await client.query(deleteQuery, [id]);
      
      await client.query('COMMIT');
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al eliminar equipo:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene los miembros de un equipo
   */
  public async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    try {
      const query = `
        SELECT u.id, u.team_id, u.id as user_id, u.name, u.email, u.role
        FROM users u
        WHERE u.team_id = $1
      `;

      const result = await this.pool.query(query, [teamId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error al obtener miembros del equipo:', error);
      throw error;
    }
  }

  /**
   * Asigna usuarios a un equipo
   */
  public async assignUsersToTeam(
    teamId: number,
    userIds: number[],
    assignedBy: number
  ): Promise<boolean> {
    try {
      const validatedData = z.array(teamMemberSchema).parse(userIds.map(id => ({ user_id: id })));
      
      const query = `
        UPDATE users
        SET team_id = $1
        WHERE id = ANY($2)
      `;

      const result = await this.pool.query(query, [teamId, validatedData.map(d => d.user_id)]);
      
      if (result.rowCount && result.rowCount > 0) {
        // Registrar la acción en los logs
        await teamLogService.logAction(
          teamId,
          assignedBy,
          TeamAction.ASSIGN_USERS,
          { 
            team_id: teamId,
            assigned_users: validatedData.map(d => d.user_id)
          }
        );
      }

      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      logger.error('Error al asignar usuarios al equipo:', error);
      throw error;
    }
  }

  /**
   * Verifica si un usuario tiene permiso para gestionar un equipo
   */
  public async canManageTeam(userId: number, teamId: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT u.role
        FROM users u
        WHERE u.id = $1
      `;

      const result = await client.query(query, [userId]);
      const user = result.rows[0];

      if (!user) return false;

      // Los administradores pueden gestionar todos los equipos
      if (user.role === 'admin') return true;

      // Los managers solo pueden gestionar equipos donde tienen usuarios asignados
      if (user.role === 'manager') {
        const teamQuery = `
          SELECT EXISTS (
            SELECT 1
            FROM users
            WHERE team_id = $1
          )
        `;

        const teamResult = await client.query(teamQuery, [teamId]);
        return teamResult.rows[0].exists;
      }

      return false;
    } catch (error) {
      logger.error('Error al verificar permisos de equipo:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Asigna leads a un equipo
   */
  public async assignLeadsToTeam(
    teamId: number,
    leadIds: number[],
    userId: number
  ): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar que el equipo existe
      const teamResult = await client.query(
        'SELECT id FROM teams WHERE id = $1',
        [teamId]
      );

      if (teamResult.rows.length === 0) {
        throw new Error('Equipo no encontrado');
      }

      // Verificar que el usuario tiene permisos para gestionar el equipo
      const canManage = await this.canManageTeam(userId, teamId);
      if (!canManage) {
        throw new Error('No tienes permisos para gestionar este equipo');
      }

      // Actualizar los leads asignados
      await client.query(
        'UPDATE leads SET team_id = $1, updated_at = NOW() WHERE id = ANY($2)',
        [teamId, leadIds]
      );

      // Registrar en el log
      await client.query(
        'INSERT INTO team_logs (team_id, action, details, user_id) VALUES ($1, $2, $3, $4)',
        [
          teamId,
          'assign_leads',
          JSON.stringify({ leadIds }),
          userId
        ]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene todos los leads asignados a un equipo
   */
  public async getTeamLeads(
    teamId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ leads: any[]; total: number }> {
    const offset = (page - 1) * limit;

    const result = await this.pool.query(
      `SELECT l.*, 
              u.name as assigned_user_name,
              COUNT(*) OVER() as total_count
       FROM leads l
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.team_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
      [teamId, limit, offset]
    );

    const total = parseInt(result.rows[0]?.total_count || '0');
    const leads = result.rows.map(row => ({
      ...row,
      total_count: undefined
    }));

    return {
      leads,
      total
    };
  }

  /**
   * Elimina la asignación de leads a un equipo
   */
  public async removeLeadsFromTeam(
    teamId: number,
    leadIds: number[],
    userId: number
  ): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar que el usuario tiene permisos para gestionar el equipo
      const canManage = await this.canManageTeam(userId, teamId);
      if (!canManage) {
        throw new Error('No tienes permisos para gestionar este equipo');
      }

      // Actualizar los leads para quitar la asignación al equipo
      await client.query(
        'UPDATE leads SET team_id = NULL, updated_at = NOW() WHERE id = ANY($1) AND team_id = $2',
        [leadIds, teamId]
      );

      // Registrar en el log
      await client.query(
        'INSERT INTO team_logs (team_id, action, details, user_id) VALUES ($1, $2, $3, $4)',
        [
          teamId,
          'remove_leads',
          JSON.stringify({ leadIds }),
          userId
        ]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Desasigna usuarios de un equipo
   */
  public async removeUsersFromTeam(
    teamId: number,
    userIds: number[],
    removedBy: number
  ): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar que el equipo existe
      const teamResult = await client.query(
        'SELECT id FROM teams WHERE id = $1',
        [teamId]
      );

      if (teamResult.rows.length === 0) {
        throw new Error('Equipo no encontrado');
      }

      // Verificar que el usuario tiene permisos para gestionar el equipo
      const canManage = await this.canManageTeam(removedBy, teamId);
      if (!canManage) {
        throw new Error('No tienes permisos para gestionar este equipo');
      }

      // Desasignar usuarios del equipo
      await client.query(
        'UPDATE users SET team_id = NULL WHERE id = ANY($1) AND team_id = $2',
        [userIds, teamId]
      );

      // Registrar en el log
      await client.query(
        'INSERT INTO team_logs (team_id, action, details, user_id) VALUES ($1, $2, $3, $4)',
        [
          teamId,
          'remove_users',
          JSON.stringify({ userIds }),
          removedBy
        ]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al desasignar usuarios del equipo:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const teamService = new TeamService(); 