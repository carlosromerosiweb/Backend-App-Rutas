import pool from '../db';
import { logger } from '../utils/logger';
import { GamificationService } from './gamification.service';

const gamificationService = new GamificationService();

export class LeadsService {
  // ... existing code ...

  async updateLeadStatus(leadId: number, status: string, userId: number): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener el estado anterior
      const oldStatus = await client.query(
        'SELECT status FROM leads WHERE id = $1',
        [leadId]
      );

      // Actualizar el estado
      const result = await client.query(
        `UPDATE leads 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [status, leadId]
      );

      // Asignar puntos si el lead se marca como cliente
      if (status === 'cliente' && oldStatus.rows[0]?.status !== 'cliente') {
        await gamificationService.updateUserPoints(userId, 50, 'lead_won');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al actualizar estado del lead:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ... existing code ...
} 