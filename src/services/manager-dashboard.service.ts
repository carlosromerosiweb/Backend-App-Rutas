import { Pool } from 'pg';
import pool from '../db';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Esquemas de validación
const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export class ManagerDashboardService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Obtiene las estadísticas generales del equipo para un manager
   */
  public async getTeamOverview(managerId: number, dateRange?: z.infer<typeof dateRangeSchema>) {
    const client = await this.pool.connect();
    try {
      // Validar fechas si se proporcionan
      const validatedDateRange = dateRange ? dateRangeSchema.parse(dateRange) : null;
      
      const query = `
        WITH team_stats AS (
          SELECT 
            t.id as team_id,
            t.name as team_name,
            COUNT(DISTINCT u.id) as total_users,
            COUNT(DISTINCT c.id) as total_checkins,
            COUNT(DISTINCT l.id) as total_leads,
            COUNT(DISTINCT CASE WHEN l.status = 'ganado' THEN l.id END) as total_sales,
            COALESCE(AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/60), 0) as avg_duration_minutes
          FROM teams t
          LEFT JOIN users u ON u.team_id = t.id
          LEFT JOIN checkins c ON c.user_id = u.id
          LEFT JOIN leads l ON l.assigned_to = u.id
          WHERE EXISTS (
            SELECT 1 FROM users u2 
            WHERE u2.team_id = t.id 
            AND u2.id = $1
          )
          ${validatedDateRange ? `
          AND (
            (c.created_at >= $2 AND c.created_at <= $3)
            OR (l.created_at >= $2 AND l.created_at <= $3)
          )
          ` : ''}
          GROUP BY t.id, t.name
        )
        SELECT 
          team_id,
          team_name,
          total_users,
          total_checkins,
          total_leads,
          total_sales,
          avg_duration_minutes,
          CASE 
            WHEN total_leads > 0 THEN (total_sales::float / total_leads) * 100 
            ELSE 0 
          END as conversion_rate
        FROM team_stats
      `;

      const params = validatedDateRange 
        ? [managerId, validatedDateRange.startDate, validatedDateRange.endDate]
        : [managerId];

      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error al obtener estadísticas del equipo:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene el ranking de usuarios dentro del equipo
   */
  public async getTeamRanking(managerId: number, dateRange?: z.infer<typeof dateRangeSchema>) {
    const client = await this.pool.connect();
    try {
      const validatedDateRange = dateRange ? dateRangeSchema.parse(dateRange) : null;
      
      const query = `
        WITH user_stats AS (
          SELECT 
            u.id as user_id,
            u.name as user_name,
            COUNT(DISTINCT c.id) as total_checkins,
            COUNT(DISTINCT l.id) as total_leads,
            COUNT(DISTINCT CASE WHEN l.status = 'ganado' THEN l.id END) as total_sales,
            COALESCE(AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/60), 0) as avg_duration_minutes,
            CASE 
              WHEN COUNT(DISTINCT l.id) > 0 
              THEN (COUNT(DISTINCT CASE WHEN l.status = 'ganado' THEN l.id END)::float / COUNT(DISTINCT l.id)) * 100 
              ELSE 0 
            END as conversion_rate
          FROM users u
          JOIN teams t ON t.id = u.team_id
          LEFT JOIN checkins c ON c.user_id = u.id
          LEFT JOIN leads l ON l.assigned_to = u.id
          WHERE EXISTS (
            SELECT 1 FROM users u2 
            WHERE u2.team_id = t.id 
            AND u2.id = $1
          )
          ${validatedDateRange ? `
          AND (
            (c.created_at >= $2 AND c.created_at <= $3)
            OR (l.created_at >= $2 AND l.created_at <= $3)
          )
          ` : ''}
          GROUP BY u.id, u.name
        )
        SELECT 
          user_id,
          user_name,
          total_checkins,
          total_leads,
          total_sales,
          avg_duration_minutes,
          conversion_rate,
          RANK() OVER (ORDER BY total_sales DESC) as sales_rank,
          RANK() OVER (ORDER BY conversion_rate DESC) as conversion_rank
        FROM user_stats
        ORDER BY sales_rank
      `;

      const params = validatedDateRange 
        ? [managerId, validatedDateRange.startDate, validatedDateRange.endDate]
        : [managerId];

      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error al obtener ranking del equipo:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene los leads atrasados y en seguimiento
   */
  public async getLeadsStatus(managerId: number) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT 
          l.id,
          l.name as lead_name,
          l.status,
          l.priority,
          l.type,
          l.next_followup,
          l.estimated_value,
          u.name as assigned_to,
          CASE 
            WHEN l.next_followup < NOW() THEN true 
            ELSE false 
          END as is_overdue
        FROM leads l
        JOIN users u ON u.id = l.assigned_to
        JOIN teams t ON t.id = u.team_id
        WHERE EXISTS (
          SELECT 1 FROM users u2 
          WHERE u2.team_id = t.id 
          AND u2.id = $1
        )
        AND l.status NOT IN ('won', 'lost')
        ORDER BY l.next_followup ASC
      `;

      const result = await client.query(query, [managerId]);
      return result.rows;
    } catch (error) {
      logger.error('Error al obtener estado de leads:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene los check-ins con retrasos
   */
  public async getDelayedCheckins(managerId: number, dateRange?: z.infer<typeof dateRangeSchema>) {
    const client = await this.pool.connect();
    try {
      const validatedDateRange = dateRange ? dateRangeSchema.parse(dateRange) : null;
      
      const query = `
        SELECT 
          c.id,
          c.lead_id,
          l.name as lead_name,
          u.name as user_name,
          c.created_at as checkin_time,
          c.updated_at as checkout_time,
          EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/60 as duration_minutes
        FROM checkins c
        JOIN leads l ON c.lead_id = l.id
        JOIN users u ON c.user_id = u.id
        WHERE u.team_id = $1
        AND c.updated_at IS NOT NULL
        AND EXTRACT(EPOCH FROM (c.updated_at - c.created_at))/60 > 30
        ${validatedDateRange ? `
        AND c.created_at >= $2 AND c.created_at <= $3
        ` : ''}
        ORDER BY c.created_at DESC
      `;

      const params = validatedDateRange 
        ? [managerId, validatedDateRange.startDate, validatedDateRange.endDate]
        : [managerId];

      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error al obtener check-ins retrasados:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Exporta datos del equipo a CSV
   */
  public async exportTeamData(
    managerId: number, 
    dateRange: z.infer<typeof dateRangeSchema>,
    filters: {
      campaign?: string;
      status?: string;
    }
  ) {
    const client = await this.pool.connect();
    try {
      const validatedDateRange = dateRangeSchema.parse(dateRange);
      
      const query = `
        SELECT 
          l.id,
          l.name as lead_name,
          l.status,
          l.priority,
          l.type,
          l.campaign,
          l.created_at,
          l.next_followup,
          l.estimated_value,
          u.name as assigned_to,
          t.name as team_name,
          COUNT(c.id) as total_checkins,
          COUNT(CASE WHEN c.status IN ('late', 'out_of_zone') THEN 1 END) as delayed_checkins
        FROM leads l
        JOIN users u ON u.id = l.assigned_to
        JOIN teams t ON t.id = u.team_id
        LEFT JOIN checkins c ON c.lead_id = l.id
        WHERE EXISTS (
          SELECT 1 FROM users u2 
          WHERE u2.team_id = t.id 
          AND u2.id = $1
        )
        AND l.created_at >= $2 AND l.created_at <= $3
        ${filters.campaign ? 'AND l.campaign = $4' : ''}
        ${filters.status ? 'AND l.status = $5' : ''}
        GROUP BY l.id, l.name, l.status, l.priority, l.type, l.campaign, 
                 l.created_at, l.next_followup, l.estimated_value, 
                 u.name, t.name
        ORDER BY l.created_at DESC
      `;

      const params = [
        managerId,
        validatedDateRange.startDate,
        validatedDateRange.endDate,
        ...(filters.campaign ? [filters.campaign] : []),
        ...(filters.status ? [filters.status] : [])
      ];

      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error al exportar datos del equipo:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export const managerDashboardService = new ManagerDashboardService(); 