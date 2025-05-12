import pool from '../db';
import { OfflineSyncPayload, SyncResponse, OfflineLead, OfflineCheckin, OfflineLeadInteraction } from '../types/offline-sync';
import { logger } from '../utils/logger';

export class OfflineSyncService {
  private async logSync(userId: string, data: OfflineSyncPayload) {
    try {
      await pool.query(
        'INSERT INTO system_logs (type, user_id, details, created_at) VALUES ($1, $2, $3, $4)',
        [
          'offline_sync',
          userId,
          JSON.stringify({
            checkins_count: data.checkins.length,
            lead_interactions_count: data.lead_interactions.length,
            leads_count: data.leads.length,
          }),
          new Date(),
        ]
      );
    } catch (error) {
      logger.error('Error al registrar sincronización:', error);
      // No lanzamos el error para no interrumpir el proceso principal
    }
  }

  async syncOfflineData(data: OfflineSyncPayload, userId: string): Promise<SyncResponse> {
    const client = await pool.connect();
    try {
      // Validar límite de registros
      const totalRecords = data.checkins.length + data.lead_interactions.length + data.leads.length;
      if (totalRecords > 1000) {
        throw new Error('El límite máximo de registros por sincronización es 1000');
      }

      await client.query('BEGIN');

      // Procesar leads
      const processedLeads = await this.processLeads(client, data.leads, userId);

      // Procesar checkins
      const processedCheckins = await this.processCheckins(client, data.checkins, userId);

      // Procesar interacciones
      const processedInteractions = await this.processLeadInteractions(client, data.lead_interactions, userId);

      // Registrar la sincronización
      await this.logSync(userId, data);

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          leads: processedLeads,
          checkins: processedCheckins,
          lead_interactions: processedInteractions,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(err => {
        logger.error('Error al hacer rollback:', err);
      });

      logger.error('Error en sincronización offline:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en la sincronización',
      };
    } finally {
      client.release();
    }
  }

  private async processLeads(client: any, leads: OfflineLead[], userId: string) {
    const results = [];
    for (const lead of leads) {
      try {
        const result = await client.query(
          `INSERT INTO leads (
            name, email, phone, address, city, state, country,
            coordinates, estimated_value, status, assigned_to,
            created_at, updated_at, next_followup
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            country = EXCLUDED.country,
            coordinates = EXCLUDED.coordinates,
            estimated_value = EXCLUDED.estimated_value,
            status = EXCLUDED.status,
            assigned_to = EXCLUDED.assigned_to,
            updated_at = EXCLUDED.updated_at,
            next_followup = EXCLUDED.next_followup
          RETURNING *`,
          [
            lead.name,
            lead.email,
            lead.phone,
            lead.address,
            lead.city,
            lead.state,
            lead.country,
            lead.coordinates ? JSON.stringify(lead.coordinates) : null,
            lead.estimated_value,
            lead.status,
            userId,
            new Date(lead.created_at),
            new Date(lead.updated_at),
            lead.next_followup ? new Date(lead.next_followup) : null,
          ]
        );
        results.push(result.rows[0]);
      } catch (error) {
        logger.error(`Error al procesar lead ${lead.local_id}:`, error);
        throw error;
      }
    }
    return results;
  }

  private async processCheckins(client: any, checkins: OfflineCheckin[], userId: string) {
    const results = [];
    for (const checkin of checkins) {
      try {
        const result = await client.query(
          `INSERT INTO checkins (
            lead_id, user_id, location_lat, location_lng,
            notes, photos, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            location_lat = EXCLUDED.location_lat,
            location_lng = EXCLUDED.location_lng,
            notes = EXCLUDED.notes,
            photos = EXCLUDED.photos
          RETURNING *`,
          [
            checkin.lead_id,
            userId,
            checkin.latitude,
            checkin.longitude,
            checkin.notes,
            checkin.photos ? JSON.stringify(checkin.photos) : null,
            new Date(checkin.created_at),
          ]
        );
        results.push(result.rows[0]);
      } catch (error) {
        logger.error(`Error al procesar checkin ${checkin.local_id}:`, error);
        throw error;
      }
    }
    return results;
  }

  private async processLeadInteractions(client: any, interactions: OfflineLeadInteraction[], userId: string) {
    const results = [];
    for (const interaction of interactions) {
      try {
        const result = await client.query(
          `INSERT INTO lead_interactions (
            lead_id, user_id, type, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            notes = EXCLUDED.notes
          RETURNING *`,
          [
            interaction.lead_id,
            userId,
            interaction.type,
            interaction.notes,
            new Date(interaction.created_at),
          ]
        );
        results.push(result.rows[0]);
      } catch (error) {
        logger.error(`Error al procesar interacción ${interaction.local_id}:`, error);
        throw error;
      }
    }
    return results;
  }
} 