import { Pool } from 'pg';
import pool from '../db';
import { BADGES, Badge } from '../config/badges';
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
  async checkAndAssignBadges(userId: number): Promise<void> {
    try {
      // Verificar cada badge
      for (const [key, badge] of Object.entries(BADGES)) {
        // Verificar si el usuario ya tiene el badge
        const existingBadge = await this.pool.query(
          'SELECT * FROM user_badges WHERE user_id = $1 AND badge_name = $2',
          [userId, badge.id]
        );

        // Si el badge es permanente y ya existe, saltamos
        if (badge.type === 'PERMANENT' && existingBadge.rows.length > 0) {
          continue;
        }

        // Verificar si el usuario cumple con la condición del badge
        const shouldAssign = await badge.checkCondition(userId, this.pool);

        if (shouldAssign) {
          // Asignar el badge
          await this.pool.query(
            'INSERT INTO user_badges (user_id, badge_name, date_earned) VALUES ($1, $2, CURRENT_TIMESTAMP)',
            [userId, badge.id]
          );

          // Registrar en el log del sistema
          await this.pool.query(
            `INSERT INTO system_logs (user_id, action, metadata)
             VALUES ($1, 'BADGE_EARNED', $2)`,
            [userId, JSON.stringify({
              badge_id: badge.id,
              badge_name: badge.name,
              badge_type: badge.type
            })]
          );
        }
      }
    } catch (error) {
      logger.error('Error checking badges:', error);
      throw error;
    }
  }

  // Obtener badges de un usuario
  async getUserBadges(userId: number): Promise<any[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM user_badges WHERE user_id = $1 ORDER BY date_earned DESC',
        [userId]
      );

      // Enriquecer la información de los badges con sus detalles
      return result.rows.map((badge: { badge_name: string }) => ({
        ...badge,
        ...BADGES[badge.badge_name]
      }));
    } catch (error) {
      logger.error('Error getting user badges:', error);
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