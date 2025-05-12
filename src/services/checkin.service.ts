import { Pool, PoolClient } from 'pg';
import { CheckInLocation, CheckInResult, CheckInRecord, AutoCheckInRequest, LeadInteraction, UserActivity } from '../types/checkin.types';
import { Lead } from '../types/lead.types';
import { calculateDistance, isWithinRadius } from '../utils/geo.utils';
import { logger } from '../utils/logger';
import { FileService } from './file.service';
import pool from '../db';

export class CheckInService {
  private pool: Pool;
  private readonly DEFAULT_RADIUS = 100; // Radio por defecto en metros
  private readonly DEFAULT_FOLLOWUP_DAYS = 7; // Días por defecto para el siguiente seguimiento

  constructor() {
    this.pool = pool;
  }

  /**
   * Procesa un check-in automático basado en la ubicación
   */
  public async processAutoCheckIn(
    userId: number,
    request: AutoCheckInRequest
  ): Promise<CheckInResult> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Obtener leads asignados al usuario con coordenadas válidas
      const leads = await this.getUserLeadsWithCoordinates(userId, client);
      
      if (leads.length === 0) {
        return {
          success: false,
          message: 'No hay leads asignados con coordenadas válidas'
        };
      }

      const radius = request.radius || this.DEFAULT_RADIUS;
      const location = request.location;

      // Encontrar el lead más cercano
      const nearestLead = this.findNearestLead(location, leads);
      
      if (!nearestLead) {
        return {
          success: false,
          message: 'No se encontró ningún lead cercano'
        };
      }

      // Verificar si está dentro del radio
      const leadCoordinates = {
        latitude: nearestLead.coordinates!.latitude,
        longitude: nearestLead.coordinates!.longitude
      };

      if (!isWithinRadius(location, leadCoordinates, radius)) {
        return {
          success: false,
          lead: nearestLead,
          distance: calculateDistance(location, leadCoordinates),
          message: 'No hay leads dentro del radio especificado'
        };
      }

      // Procesar archivos adjuntos si existen
      let attachmentUrls: string[] = [];
      if (request.files && request.files.length > 0) {
        attachmentUrls = await FileService.saveFiles(request.files);
      }

      // Registrar el check-in
      const checkInRecord = await this.registerCheckIn({
        lead_id: nearestLead.id,
        user_id: userId,
        status: nearestLead.status,
        notes: request.notes,
        location_lat: location.latitude,
        location_lng: location.longitude,
        attachment_urls: attachmentUrls
      }, client);

      // Registrar interacción con el lead
      await this.registerLeadInteraction({
        lead_id: nearestLead.id,
        user_id: userId,
        interaction_type: 'check-in automático',
        notes: request.notes,
        attachment_urls: attachmentUrls,
        lead_status: nearestLead.status
      }, client);

      // Registrar actividad del usuario
      await this.registerUserActivity({
        user_id: userId,
        action_type: 'check-in automático',
        lead_id: nearestLead.id,
        notes: request.notes,
        attachment_urls: attachmentUrls
      }, client);

      // Calcular y actualizar siguiente seguimiento
      const nextFollowup = request.next_followup || this.calculateNextFollowup();
      await this.updateLeadNextFollowup(nearestLead.id, nextFollowup, client);

      await client.query('COMMIT');

      return {
        success: true,
        lead: nearestLead,
        distance: calculateDistance(location, leadCoordinates),
        message: 'Check-in automático registrado exitosamente',
        next_followup: nextFollowup
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al procesar check-in automático:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtiene los leads asignados a un usuario que tienen coordenadas válidas
   */
  private async getUserLeadsWithCoordinates(userId: number, client: PoolClient): Promise<Lead[]> {
    const query = `
      SELECT l.* 
      FROM leads l
      WHERE l.assigned_to = $1 
      AND l.coordinates IS NOT NULL 
      AND l.coordinates->>'latitude' IS NOT NULL 
      AND l.coordinates->>'longitude' IS NOT NULL
      AND l.status != 'completado'
    `;

    const result = await client.query(query, [userId]);
    return result.rows;
  }

  /**
   * Encuentra el lead más cercano a una ubicación
   */
  private findNearestLead(location: CheckInLocation, leads: Lead[]): Lead | null {
    if (leads.length === 0) return null;

    return leads.reduce((nearest, current) => {
      const currentDistance = calculateDistance(
        location,
        { latitude: current.coordinates!.latitude, longitude: current.coordinates!.longitude }
      );
      const nearestDistance = calculateDistance(
        location,
        { latitude: nearest.coordinates!.latitude, longitude: nearest.coordinates!.longitude }
      );

      return currentDistance < nearestDistance ? current : nearest;
    });
  }

  /**
   * Registra un check-in en la base de datos
   */
  private async registerCheckIn(
    checkIn: Omit<CheckInRecord, 'id' | 'created_at' | 'updated_at'>,
    client: PoolClient
  ): Promise<CheckInRecord> {
    const query = `
      INSERT INTO checkins (
        lead_id, user_id, check_in_type, status, notes, 
        location_lat, location_lng, attachment_urls,
        created_at, updated_at
      )
      VALUES ($1, $2, 'auto', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      checkIn.lead_id,
      checkIn.user_id,
      checkIn.status,
      checkIn.notes,
      checkIn.location_lat,
      checkIn.location_lng,
      checkIn.attachment_urls
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  /**
   * Registra una interacción con el lead
   */
  private async registerLeadInteraction(
    interaction: Omit<LeadInteraction, 'id' | 'created_at'>,
    client: PoolClient
  ): Promise<LeadInteraction> {
    const query = `
      INSERT INTO lead_interactions (
        lead_id, user_id, interaction_type, notes,
        attachment_urls, lead_status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      interaction.lead_id,
      interaction.user_id,
      interaction.interaction_type,
      interaction.notes,
      interaction.attachment_urls,
      interaction.lead_status
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  /**
   * Registra una actividad del usuario
   */
  private async registerUserActivity(
    activity: Omit<UserActivity, 'id' | 'created_at'>,
    client: PoolClient
  ): Promise<UserActivity> {
    const query = `
      INSERT INTO user_activities (
        user_id, action_type, lead_id, notes,
        attachment_urls, created_at
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      activity.user_id,
      activity.action_type,
      activity.lead_id,
      activity.notes,
      activity.attachment_urls
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  /**
   * Actualiza la fecha del siguiente seguimiento del lead
   */
  private async updateLeadNextFollowup(
    leadId: number,
    nextFollowup: Date,
    client: PoolClient
  ): Promise<void> {
    const query = `
      UPDATE leads
      SET next_followup = $1
      WHERE id = $2
    `;

    await client.query(query, [nextFollowup, leadId]);
  }

  /**
   * Calcula la fecha del siguiente seguimiento
   */
  private calculateNextFollowup(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.DEFAULT_FOLLOWUP_DAYS);
    return date;
  }
}

// Exportar una instancia singleton
export const checkInService = new CheckInService(); 