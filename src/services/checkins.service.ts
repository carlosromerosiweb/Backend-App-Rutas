import pool from '../db';
import { logger } from '../utils/logger';
import { GamificationService } from './gamification.service';

const gamificationService = new GamificationService();

export class CheckinsService {
  // ... existing code ...

  async createCheckin(userId: number, data: any): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Crear el checkin
      const result = await client.query(
        `INSERT INTO checkins (user_id, location_id, checkin_time, status)
         VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
         RETURNING *`,
        [userId, data.location_id, data.status]
      );

      // Asignar puntos por checkin exitoso
      if (data.status === 'completed') {
        await gamificationService.updateUserPoints(userId, 10, 'checkin_completed');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al crear checkin:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ... existing code ...
} 