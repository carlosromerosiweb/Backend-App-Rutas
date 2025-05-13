import pool from '../db';
import { logger } from '../utils/logger';
import { GamificationService } from './gamification.service';

const gamificationService = new GamificationService();

export class LeadInteractionsService {
  // ... existing code ...

  async createInteraction(userId: number, leadId: number, data: any): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Crear la interacción
      const result = await client.query(
        `INSERT INTO lead_interactions (user_id, lead_id, interaction_type, notes, created_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, leadId, data.interaction_type, data.notes]
      );

      // Asignar puntos por seguimiento
      if (data.interaction_type === 'seguimiento') {
        await gamificationService.updateUserPoints(userId, 20, 'lead_followup');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al crear interacción:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ... existing code ...
} 