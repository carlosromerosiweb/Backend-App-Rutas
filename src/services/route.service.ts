import pool from '../db';
import { CreateRouteDto, UpdateRouteDto, AssignUserDto, AssignLeadsDto, Route } from '../types/route.types';
import { logger } from '../utils/logger';

export class RouteService {
  async createRoute(input: CreateRouteDto, userId: number): Promise<Route> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO routes (name, description, team_id, status, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [input.name, input.description, input.team_id, input.status, userId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en createRoute:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getRoutesByTeam(teamId: number): Promise<Route[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM routes WHERE team_id = $1',
        [teamId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error en getRoutesByTeam:', error);
      throw error;
    }
  }

  async updateRoute(routeId: number, input: UpdateRouteDto, userId: number): Promise<Route> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE routes 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             status = COALESCE($3, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND team_id IN (
           SELECT team_id FROM team_members WHERE user_id = $5 AND role = 'manager'
         )
         RETURNING *`,
        [input.name, input.description, input.status, routeId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Ruta no encontrada o no tienes permisos para modificarla');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en updateRoute:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteRoute(routeId: number, userId: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `DELETE FROM routes 
         WHERE id = $1 AND team_id IN (
           SELECT team_id FROM team_members WHERE user_id = $2 AND role = 'manager'
         )
         RETURNING id`,
        [routeId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Ruta no encontrada o no tienes permisos para eliminarla');
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en deleteRoute:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async assignUser(routeId: number, input: AssignUserDto, userId: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar que el usuario que asigna es manager del equipo
      const teamCheck = await client.query(
        `SELECT r.team_id 
         FROM routes r
         JOIN team_members tm ON r.team_id = tm.team_id
         WHERE r.id = $1 AND tm.user_id = $2 AND tm.role = 'manager'`,
        [routeId, userId]
      );

      if (teamCheck.rows.length === 0) {
        throw new Error('No tienes permisos para asignar usuarios a esta ruta');
      }

      // Verificar que el usuario a asignar pertenece al equipo
      const userCheck = await client.query(
        `SELECT 1 FROM team_members 
         WHERE team_id = $1 AND user_id = $2`,
        [teamCheck.rows[0].team_id, input.user_id]
      );

      if (userCheck.rows.length === 0) {
        throw new Error('El usuario no pertenece al equipo de la ruta');
      }

      // Asignar usuario a la ruta
      await client.query(
        `INSERT INTO route_assignments (route_id, user_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (route_id, user_id) DO NOTHING`,
        [routeId, input.user_id, userId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en assignUser:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async assignLeads(routeId: number, input: AssignLeadsDto, userId: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar que el usuario que asigna es manager del equipo
      const teamCheck = await client.query(
        `SELECT r.team_id 
         FROM routes r
         JOIN team_members tm ON r.team_id = tm.team_id
         WHERE r.id = $1 AND tm.user_id = $2 AND tm.role = 'manager'`,
        [routeId, userId]
      );

      if (teamCheck.rows.length === 0) {
        throw new Error('No tienes permisos para asignar leads a esta ruta');
      }

      // Asignar leads a la ruta
      for (const leadId of input.lead_ids) {
        await client.query(
          `INSERT INTO route_leads (route_id, lead_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (route_id, lead_id) DO NOTHING`,
          [routeId, leadId, userId]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en assignLeads:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getRouteLeads(routeId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT l.* 
         FROM leads l
         JOIN route_leads rl ON l.id = rl.lead_id
         WHERE rl.route_id = $1`,
        [routeId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error en getRouteLeads:', error);
      throw error;
    }
  }

  async getRouteUsers(routeId: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.team_id
         FROM users u
         JOIN route_assignments ra ON u.id = ra.user_id
         WHERE ra.route_id = $1`,
        [routeId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error en getRouteUsers:', error);
      throw error;
    }
  }
} 