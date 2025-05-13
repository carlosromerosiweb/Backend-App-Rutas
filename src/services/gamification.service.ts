import { Pool } from 'pg';
import pool from '../db';
import { logger } from '../utils/logger';

export class GamificationService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // Obtener puntos de un usuario
  async getUserPoints(userId: number): Promise<number> {
    try {
      const result = await this.pool.query(
        'SELECT COALESCE(points_total, 0) as points FROM user_points WHERE user_id = $1',
        [userId]
      );
      return result.rows[0]?.points || 0;
    } catch (error) {
      logger.error('Error al obtener puntos del usuario:', error);
      throw error;
    }
  }

  // Actualizar puntos de un usuario
  public async updateUserPoints(userId: number, points: number, reason: string): Promise<void> {
    try {
      // Actualizar puntos del usuario en la tabla user_points
      await this.pool.query(
        `INSERT INTO user_points (user_id, points_total, last_updated)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) 
         DO UPDATE SET 
           points_total = user_points.points_total + $2,
           last_updated = CURRENT_TIMESTAMP`,
        [userId, points]
      );

      // Registrar en el log del sistema
      await this.pool.query(
        `INSERT INTO system_logs (
          user_id,
          action,
          entity,
          entity_id,
          message,
          status,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          'POINTS_UPDATE',
          'USER',
          userId,
          `Puntos actualizados: ${points} por ${reason}`,
          'success',
          JSON.stringify({ points, reason })
        ]
      );

      // Verificar y asignar insignias
      await this.checkAndAssignBadges(userId);
    } catch (error) {
      logger.error('Error al actualizar puntos:', error);
      throw error;
    }
  }

  // Verificar y otorgar badges
  private async checkAndAssignBadges(userId: number): Promise<void> {
    try {
      const result = await this.pool.query(
        'SELECT points_total FROM user_points WHERE user_id = $1',
        [userId]
      );
      const points = result.rows[0]?.points_total || 0;

      // Definir umbrales de badges
      const badgeThresholds = [
        { points: 100, badge: 'Primer logro' },
        { points: 500, badge: 'Super comercial' },
        { points: 1000, badge: 'Leyenda de ventas' }
      ];

      for (const threshold of badgeThresholds) {
        if (points >= threshold.points) {
          // Verificar si ya tiene el badge
          const existingBadge = await this.pool.query(
            'SELECT id FROM user_badges WHERE user_id = $1 AND badge_name = $2',
            [userId, threshold.badge]
          );

          if (existingBadge.rows.length === 0) {
            // Otorgar nuevo badge
            await this.pool.query(
              `INSERT INTO user_badges (user_id, badge_name, date_earned)
               VALUES ($1, $2, CURRENT_TIMESTAMP)`,
              [userId, threshold.badge]
            );

            // Registrar en system_logs
            await this.pool.query(
              `INSERT INTO system_logs (user_id, action, details)
               VALUES ($1, 'badge_earned', $2)`,
              [userId, JSON.stringify({ badge: threshold.badge })]
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error al verificar badges:', error);
      throw error;
    }
  }

  // Obtener top 10 usuarios con más puntos
  async getTopUsers(): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT u.id, u.name, up.points_total
         FROM users u
         JOIN user_points up ON u.id = up.user_id
         ORDER BY up.points_total DESC
         LIMIT 10`
      );
      return result.rows;
    } catch (error) {
      logger.error('Error al obtener top usuarios:', error);
      throw error;
    }
  }

  // Obtener badges de un usuario
  async getUserBadges(userId: number): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT badge_name, date_earned
         FROM user_badges
         WHERE user_id = $1
         ORDER BY date_earned DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error al obtener badges del usuario:', error);
      throw error;
    }
  }

  // Obtener resumen de gamificación para un usuario
  async getUserGamificationSummary(userId: number): Promise<any> {
    try {
      // Obtener puntos directamente de user_points
      const pointsResult = await this.pool.query(
        'SELECT COALESCE(points_total, 0) as points FROM user_points WHERE user_id = $1',
        [userId]
      );
      const points = pointsResult.rows[0]?.points || 0;

      // Obtener badges
      const badgesResult = await this.pool.query(
        `SELECT badge_name, date_earned
         FROM user_badges
         WHERE user_id = $1
         ORDER BY date_earned DESC`,
        [userId]
      );

      // Obtener ranking
      const rankingResult = await this.pool.query(
        `SELECT position
         FROM (
           SELECT user_id, ROW_NUMBER() OVER (ORDER BY points_total DESC) as position
           FROM user_points
         ) ranked
         WHERE user_id = $1`,
        [userId]
      );

      return {
        points,
        badges: badgesResult.rows,
        ranking: rankingResult.rows[0]?.position || 0
      };
    } catch (error) {
      logger.error('Error al obtener resumen de gamificación:', error);
      throw error;
    }
  }
} 