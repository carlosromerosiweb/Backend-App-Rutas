/**
 * Servicio para la gestión de leads/clientes potenciales
 */
import { Pool } from 'pg';
import pool from '../db';
import { logger } from '../utils/logger';
import { GamificationService } from './gamification.service';
import { 
  Lead, 
  LeadStatus, 
  LeadType, 
  LeadPriority, 
  CreateLeadDto, 
  UpdateLeadDto, 
  LeadFilters,
  LeadInteraction,
  CreateLeadInteractionDto,
  LeadSummary,
  PaginatedLeadResponse
} from '../types/leads';

const gamificationService = new GamificationService();

class LeadService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
    this.initializeTables();
  }

  /**
   * Inicializa las tablas necesarias para el sistema de leads
   */
  public async initializeTables(): Promise<boolean> {
    try {
      // Crear tabla de leads si no existe
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          address TEXT,
          city VARCHAR(100),
          postal_code VARCHAR(20),
          country VARCHAR(100) DEFAULT 'España',
          type VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT '${LeadStatus.NEW}',
          priority VARCHAR(20) NOT NULL DEFAULT '${LeadPriority.MEDIUM}',
          assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
          notes TEXT,
          estimated_value NUMERIC(12, 2),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          last_contact TIMESTAMP,
          next_followup TIMESTAMP,
          coordinates JSONB,
          tags TEXT[],
          place_id VARCHAR(255),
          rating NUMERIC(3, 1),
          category VARCHAR(100)
        )
      `);

      // Crear tabla de interacciones con leads si no existe
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS lead_interactions (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
          interaction_type VARCHAR(50) NOT NULL,
          notes TEXT NOT NULL,
          outcome TEXT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
          date TIMESTAMP NOT NULL DEFAULT NOW(),
          duration INTEGER,
          location JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      // Crear índices para mejorar rendimiento de consultas
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
        CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
        CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
        CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
        CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
        CREATE INDEX IF NOT EXISTS idx_lead_interactions_user_id ON lead_interactions(user_id);
      `);

      logger.info('Tablas de leads inicializadas correctamente');
      return true;
    } catch (error) {
      logger.error('Error al inicializar tablas de leads:', error);
      return false;
    }
  }

  /**
   * Crea un nuevo lead
   * @param leadDto Datos del lead a crear
   */
  public async createLead(leadDto: CreateLeadDto): Promise<Lead | null> {
    try {
      // Establecer valores por defecto para campos opcionales
      const status = leadDto.status || LeadStatus.NEW;
      const priority = leadDto.priority || LeadPriority.MEDIUM;
      const country = leadDto.country || 'España';
      
      // Para coordinates no necesitamos JSON.stringify, PostgreSQL maneja JSONB automáticamente
      const coordinates = leadDto.coordinates || null;
      const tags = leadDto.tags || [];

      // Consulta de inserción
      const query = `
        INSERT INTO leads (
          name, email, phone, address, city, postal_code, country,
          type, status, priority, assigned_to, notes, estimated_value,
          coordinates, tags, next_followup
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `;

      const values = [
        leadDto.name,
        leadDto.email || null,
        leadDto.phone || null,
        leadDto.address || null,
        leadDto.city || null,
        leadDto.postal_code || null,
        country,
        leadDto.type,
        status,
        priority,
        leadDto.assigned_to || null,
        leadDto.notes || null,
        leadDto.estimated_value || null,
        coordinates,
        tags,
        leadDto.next_followup || null
      ];

      const result = await this.pool.query(query, values);
      const lead: Lead = result.rows[0];
      
      logger.info(`Lead creado correctamente: ${lead.id} - ${lead.name}`);
      return lead;
    } catch (error) {
      logger.error('Error al crear lead:', error);
      return null;
    }
  }

  /**
   * Obtiene un lead por su ID
   * @param id ID del lead
   */
  public async getLeadById(id: number): Promise<Lead | null> {
    try {
      const query = 'SELECT * FROM leads WHERE id = $1';
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0] as Lead;
    } catch (error) {
      logger.error(`Error al obtener lead ${id}:`, error);
      return null;
    }
  }

  /**
   * Actualiza un lead existente
   * @param id ID del lead a actualizar
   * @param leadDto Datos actualizados del lead
   */
  public async updateLead(id: number, leadDto: UpdateLeadDto): Promise<Lead | null> {
    try {
      // Obtener lead actual para verificar que existe
      const currentLead = await this.getLeadById(id);
      if (!currentLead) {
        return null;
      }

      // Preparar los campos a actualizar
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Función auxiliar para añadir campos a actualizar
      const addUpdateField = (field: string, value: any) => {
        if (value !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      };

      // Añadir cada campo presente en el DTO
      addUpdateField('name', leadDto.name);
      addUpdateField('email', leadDto.email);
      addUpdateField('phone', leadDto.phone);
      addUpdateField('address', leadDto.address);
      addUpdateField('city', leadDto.city);
      addUpdateField('postal_code', leadDto.postal_code);
      addUpdateField('country', leadDto.country);
      addUpdateField('type', leadDto.type);
      addUpdateField('status', leadDto.status);
      addUpdateField('priority', leadDto.priority);
      addUpdateField('assigned_to', leadDto.assigned_to);
      addUpdateField('notes', leadDto.notes);
      addUpdateField('estimated_value', leadDto.estimated_value);
      
      // Manejar campos JSON y arrays
      if (leadDto.coordinates) {
        addUpdateField('coordinates', leadDto.coordinates);
      }
      
      if (leadDto.tags) {
        addUpdateField('tags', leadDto.tags);
      }
      
      addUpdateField('next_followup', leadDto.next_followup);
      
      // Siempre actualizar el timestamp
      addUpdateField('updated_at', new Date());

      // Si no hay campos para actualizar, devolver el lead actual
      if (updateFields.length === 0) {
        return currentLead;
      }

      // Construir la consulta
      const query = `
        UPDATE leads 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *
      `;
      
      // Añadir el ID al final de los valores
      values.push(id);
      
      const result = await this.pool.query(query, values);
      const updatedLead: Lead = result.rows[0];
      
      logger.info(`Lead actualizado correctamente: ${updatedLead.id} - ${updatedLead.name}`);
      return updatedLead;
    } catch (error) {
      logger.error(`Error al actualizar lead ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina un lead
   * @param id ID del lead a eliminar
   */
  public async deleteLead(id: number): Promise<boolean> {
    try {
      // Verificar que el lead existe
      const lead = await this.getLeadById(id);
      if (!lead) {
        return false;
      }

      // Eliminar el lead
      const query = 'DELETE FROM leads WHERE id = $1';
      await this.pool.query(query, [id]);
      
      logger.info(`Lead eliminado correctamente: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error al eliminar lead ${id}:`, error);
      return false;
    }
  }

  /**
   * Obtiene una lista paginada de leads con filtros opcionales
   * @param filters Filtros para la búsqueda
   * @param page Número de página (comienza en 1)
   * @param limit Límite de resultados por página
   */
  public async getLeads(
    filters: LeadFilters = {}, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedLeadResponse> {
    try {
      // Calcular el offset para la paginación
      const offset = (page - 1) * limit;
      
      // Construir la consulta con filtros
      let whereConditions: string[] = [];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Función auxiliar para añadir condiciones de filtrado
      const addCondition = (condition: string, value: any) => {
        if (value !== undefined) {
          whereConditions.push(condition.replace('$index', `$${paramIndex}`));
          queryParams.push(value);
          paramIndex++;
        }
      };

      // Añadir cada filtro como condición
      if (filters.id) {
        addCondition('id = $index', filters.id);
      }

      if (filters.name) {
        addCondition('name ILIKE $index', `%${filters.name}%`);
      }

      if (filters.email) {
        addCondition('email ILIKE $index', `%${filters.email}%`);
      }

      if (filters.phone) {
        addCondition('phone ILIKE $index', `%${filters.phone}%`);
      }

      if (filters.address) {
        addCondition('address ILIKE $index', `%${filters.address}%`);
      }

      if (filters.city) {
        addCondition('city ILIKE $index', `%${filters.city}%`);
      }

      if (filters.postal_code) {
        addCondition('postal_code = $index', filters.postal_code);
      }

      if (filters.country) {
        addCondition('country ILIKE $index', `%${filters.country}%`);
      }

      if (filters.type) {
        addCondition('type = $index', filters.type);
      }

      if (filters.status) {
        addCondition('status = $index', filters.status);
      }

      if (filters.priority) {
        addCondition('priority = $index', filters.priority);
      }

      if (filters.assigned_to) {
        addCondition('assigned_to = $index', filters.assigned_to);
      }

      if (filters.notes) {
        addCondition('notes ILIKE $index', `%${filters.notes}%`);
      }

      if (filters.estimated_value) {
        addCondition('estimated_value = $index', filters.estimated_value);
      }

      if (filters.place_id) {
        addCondition('place_id = $index', filters.place_id);
      }

      if (filters.rating) {
        addCondition('rating = $index', filters.rating);
      }

      if (filters.category) {
        addCondition('category = $index', filters.category);
      }

      // Filtros de coordenadas
      if (filters.latitude && filters.longitude) {
        addCondition('coordinates->>\'latitude\' = $index AND coordinates->>\'longitude\' = $index', 
          [filters.latitude.toString(), filters.longitude.toString()]);
      } else if (filters.latitude) {
        addCondition('coordinates->>\'latitude\' = $index', filters.latitude.toString());
      } else if (filters.longitude) {
        addCondition('coordinates->>\'longitude\' = $index', filters.longitude.toString());
      }

      // Filtros de fechas
      if (filters.created_after) {
        addCondition('created_at >= $index', filters.created_after);
      }

      if (filters.created_before) {
        addCondition('created_at <= $index', filters.created_before);
      }

      if (filters.updated_after) {
        addCondition('updated_at >= $index', filters.updated_after);
      }

      if (filters.updated_before) {
        addCondition('updated_at <= $index', filters.updated_before);
      }

      if (filters.last_contact_after) {
        addCondition('last_contact >= $index', filters.last_contact_after);
      }

      if (filters.last_contact_before) {
        addCondition('last_contact <= $index', filters.last_contact_before);
      }

      if (filters.next_followup_after) {
        addCondition('next_followup >= $index', filters.next_followup_after);
      }

      if (filters.next_followup_before) {
        addCondition('next_followup <= $index', filters.next_followup_before);
      }

      // Búsqueda por tags
      if (filters.tags && filters.tags.length > 0) {
        addCondition('tags @> $index', filters.tags);
      }

      // Búsqueda general
      if (filters.search) {
        addCondition('(name ILIKE $index OR email ILIKE $index OR phone ILIKE $index OR address ILIKE $index)', 
          `%${filters.search}%`);
      }

      // Construir la cláusula WHERE
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Consulta para obtener el total de registros
      const countQuery = `
        SELECT COUNT(*) AS total FROM leads ${whereClause}
      `;
      
      const countResult = await this.pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Consulta principal con JOIN para obtener el nombre del usuario asignado
      const query = `
        SELECT 
          l.id,
          l.name,
          l.email,
          l.phone,
          l.address,
          l.city,
          l.postal_code,
          l.country,
          l.type,
          l.status,
          l.priority,
          l.assigned_to,
          l.notes,
          l.estimated_value,
          l.created_at,
          l.updated_at,
          l.last_contact,
          l.next_followup,
          l.coordinates,
          l.tags,
          l.place_id,
          l.rating,
          l.category,
          u.name as assigned_user_name
        FROM leads l
        LEFT JOIN users u ON l.assigned_to = u.id
        ${whereClause}
        ORDER BY l.updated_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      // Añadir parámetros de paginación
      queryParams.push(limit, offset);
      
      const result = await this.pool.query(query, queryParams);
      
      // Transformar los resultados al formato requerido
      const leads: Lead[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        city: row.city,
        postal_code: row.postal_code,
        country: row.country,
        type: row.type,
        status: row.status,
        priority: row.priority,
        assigned_to: row.assigned_to,
        notes: row.notes,
        estimated_value: row.estimated_value,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_contact: row.last_contact,
        next_followup: row.next_followup,
        coordinates: row.coordinates,
        tags: row.tags,
        place_id: row.place_id,
        rating: row.rating,
        category: row.category
      }));

      // Calcular el número total de páginas
      const pages = Math.ceil(total / limit);
      
      return {
        leads,
        pagination: {
          total,
          page,
          limit,
          pages
        }
      };
    } catch (error) {
      logger.error('Error al obtener lista de leads:', error);
      return {
        leads: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0
        }
      };
    }
  }

  /**
   * Registra una nueva interacción con un lead
   * @param interactionDto Datos de la interacción
   * @param userId ID del usuario que realiza la interacción
   */
  public async createInteraction(
    interactionDto: CreateLeadInteractionDto, 
    userId: number
  ): Promise<LeadInteraction | null> {
    try {
      // Verificar que el lead existe
      const lead = await this.getLeadById(interactionDto.lead_id);
      if (!lead) {
        return null;
      }

      // Preparar los valores de los campos
      const date = interactionDto.date || new Date();
      // No necesitamos JSON.stringify para location, PostgreSQL maneja JSONB automáticamente
      const location = interactionDto.location || null;

      // Crear la interacción
      const query = `
        INSERT INTO lead_interactions (
          lead_id, interaction_type, notes, outcome, user_id, date, duration, location
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) RETURNING *
      `;

      const values = [
        interactionDto.lead_id,
        interactionDto.type,
        interactionDto.notes,
        interactionDto.outcome || null,
        userId,
        date,
        interactionDto.duration || null,
        location
      ];

      const result = await this.pool.query(query, values);
      const interaction: LeadInteraction = result.rows[0];

      // Actualizar la fecha de último contacto en el lead
      await this.pool.query(
        'UPDATE leads SET last_contact = $1, updated_at = NOW() WHERE id = $2',
        [date, interactionDto.lead_id]
      );
      
      logger.info(`Interacción creada correctamente para lead ${interactionDto.lead_id}`);
      return interaction;
    } catch (error) {
      logger.error('Error al crear interacción con lead:', error);
      return null;
    }
  }

  /**
   * Obtiene las interacciones de un lead
   * @param leadId ID del lead
   * @param limit Límite de resultados
   * @param offset Desplazamiento para paginación
   */
  public async getLeadInteractions(
    leadId: number, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<{ interactions: LeadInteraction[], total: number }> {
    try {
      // Verificar que el lead existe
      const lead = await this.getLeadById(leadId);
      if (!lead) {
        return { interactions: [], total: 0 };
      }

      // Obtener el total de interacciones
      const countQuery = 'SELECT COUNT(*) AS total FROM lead_interactions WHERE lead_id = $1';
      const countResult = await this.pool.query(countQuery, [leadId]);
      const total = parseInt(countResult.rows[0].total);

      // Obtener las interacciones con JOIN para incluir info del usuario
      const query = `
        SELECT i.*, u.name as user_name 
        FROM lead_interactions i
        JOIN users u ON i.user_id = u.id
        WHERE i.lead_id = $1
        ORDER BY i.date DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.pool.query(query, [leadId, limit, offset]);
      
      // Transformar los resultados
      const interactions: LeadInteraction[] = result.rows.map(row => {
        // No necesitamos parsear location ya que PostgreSQL ya lo convierte de JSONB a objeto
        return {
          ...row,
          location: row.location || null
        };
      });
      
      return { interactions, total };
    } catch (error) {
      logger.error(`Error al obtener interacciones para lead ${leadId}:`, error);
      return { interactions: [], total: 0 };
    }
  }

  /**
   * Busca leads asignados a un comercial específico
   * @param userId ID del comercial
   * @param page Número de página
   * @param limit Límite de resultados por página
   */
  public async getLeadsByUser(
    userId: number, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedLeadResponse> {
    // Simplemente utilizamos el método getLeads con el filtro de assigned_to
    return this.getLeads({ assigned_to: userId }, page, limit);
  }

  /**
   * Actualiza el estado de un lead
   * @param id ID del lead
   * @param status Nuevo estado
   * @param notes Notas opcionales sobre el cambio de estado
   * @param userId ID del usuario que realiza el cambio
   */
  public async updateLeadStatus(
    id: number, 
    status: LeadStatus, 
    notes?: string,
    userId?: number
  ): Promise<Lead | null> {
    try {
      // Obtener el estado anterior
      const oldStatus = await this.pool.query(
        'SELECT status FROM leads WHERE id = $1',
        [id]
      );

      // Actualizar el estado del lead
      const updatedLead = await this.updateLead(id, { status });
      
      if (!updatedLead) {
        return null;
      }
      
      // Si hay notas y un usuario, registrar como una interacción
      if (notes && userId) {
        await this.createInteraction(
          {
            lead_id: id,
            type: 'cambio_estado',
            notes: `Cambio de estado a: ${status}. ${notes}`,
            outcome: `Estado actualizado a: ${status}`
          },
          userId
        );
      }

      // Asignar puntos si el lead se marca como cliente
      if (status === LeadStatus.CUSTOMER && oldStatus.rows[0]?.status !== LeadStatus.CUSTOMER && userId) {
        await gamificationService.updateUserPoints(userId, 50, 'lead_won');
      }
      
      return updatedLead;
    } catch (error) {
      logger.error(`Error al actualizar estado del lead ${id}:`, error);
      return null;
    }
  }

  /**
   * Asigna un lead a un comercial
   * @param id ID del lead
   * @param userId ID del comercial
   * @param notes Notas opcionales sobre la asignación
   * @param currentUserId ID del usuario que realiza la asignación
   */
  public async assignLeadToUser(
    id: number, 
    userId: number, 
    notes?: string,
    currentUserId?: number
  ): Promise<Lead | null> {
    try {
      // Actualizar la asignación del lead
      const updatedLead = await this.updateLead(id, { assigned_to: userId });
      
      if (!updatedLead) {
        return null;
      }
      
      // Si hay notas y un usuario actual, registrar como una interacción
      if (notes && currentUserId) {
        await this.createInteraction(
          {
            lead_id: id,
            type: 'asignacion',
            notes: `Lead asignado a usuario ID: ${userId}. ${notes}`,
            outcome: 'Lead asignado correctamente'
          },
          currentUserId
        );
      }
      
      return updatedLead;
    } catch (error) {
      logger.error(`Error al asignar lead ${id} a usuario ${userId}:`, error);
      return null;
    }
  }
}

// Exportar una instancia única del servicio
export const leadService = new LeadService();