import { Pool } from 'pg';
import pool from '../db';
import { logger } from '../utils/logger';

export enum TeamAction {
  CREATE = 'create_team',
  UPDATE = 'update_team',
  DELETE = 'delete_team',
  ASSIGN_USERS = 'assign_users',
  REMOVE_USERS = 'remove_users'
}

class TeamLogService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Registra una acción en los logs de equipos
   */
  public async logAction(
    teamId: number,
    userId: number,
    action: TeamAction,
    details: Record<string, any>
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO team_logs (team_id, user_id, action, details)
        VALUES ($1, $2, $3, $4)
      `;

      await this.pool.query(query, [
        teamId,
        userId,
        action,
        JSON.stringify(details)
      ]);
    } catch (error) {
      logger.error('Error al registrar log de equipo:', error);
      throw error;
    }
  }

  /**
   * Obtiene los logs de un equipo
   */
  public async getTeamLogs(
    teamId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ logs: any[], total: number }> {
    try {
      const offset = (page - 1) * limit;

      const countQuery = `
        SELECT COUNT(*)
        FROM team_logs
        WHERE team_id = $1
      `;
      const countResult = await this.pool.query(countQuery, [teamId]);
      const total = parseInt(countResult.rows[0].count);

      const query = `
        SELECT 
          tl.*,
          u.name as user_name,
          u.email as user_email
        FROM team_logs tl
        JOIN users u ON u.id = tl.user_id
        WHERE tl.team_id = $1
        ORDER BY tl.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.pool.query(query, [teamId, limit, offset]);
      
      return {
        logs: result.rows,
        total
      };
    } catch (error) {
      logger.error('Error al obtener logs de equipo:', error);
      throw error;
    }
  }
}

export const teamLogService = new TeamLogService(); 