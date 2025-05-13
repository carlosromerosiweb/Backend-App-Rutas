import { Request, Response } from 'express';
import pool from '../db';
import { JwtPayload } from '../types';
import { checkInService } from '../services/checkin.service';
import { AutoCheckInRequest } from '../types/checkin.types';
import { logger } from '../utils/logger';

interface CheckinRequest {
  lead_id: number;
  location_lat?: number;
  location_lng?: number;
  status: 'nuevo' | 'seguimiento' | 'ganado' | 'perdido';
  notes?: string;
  attachment_urls?: string[];
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export const createCheckin = async (req: AuthenticatedRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { lead_id, location_lat, location_lng, status, notes, attachment_urls } = req.body as CheckinRequest;
    const user_id = req.user.userId;

    // Validar que el lead existe y pertenece al comercial
    const leadCheck = await client.query(
      'SELECT id FROM leads WHERE id = $1 AND assigned_to = $2',
      [lead_id, user_id]
    );

    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Lead no encontrado o no asignado al comercial' 
      });
    }

    const result = await client.query(
      `INSERT INTO checkins (
        user_id, lead_id, location_lat, location_lng, 
        status, notes, attachment_urls
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [user_id, lead_id, location_lat, location_lng, status, notes, attachment_urls]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear check-in:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

export const getCheckins = async (req: AuthenticatedRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const user_id = req.user.userId;
    const user_role = req.user.role;

    let query = 'SELECT c.*, u.name as user_name, l.name as lead_name FROM checkins c';
    query += ' JOIN users u ON c.user_id = u.id';
    query += ' JOIN leads l ON c.lead_id = l.id';
    
    const params: any[] = [];
    
    // Si no es admin o manager, solo ver sus propios check-ins
    if (user_role !== 'admin' && user_role !== 'manager') {
      query += ' WHERE c.user_id = $1';
      params.push(user_id);
    }
    
    query += ' ORDER BY c.timestamp DESC';
    
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener check-ins:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

export const getCheckinsByLead = async (req: AuthenticatedRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const leadId = parseInt(req.params.leadId);
    const user_id = req.user.userId;
    const user_role = req.user.role;

    if (isNaN(leadId)) {
      return res.status(400).json({ 
        error: 'ID inválido',
        message: 'El ID del lead debe ser un número válido'
      });
    }

    // Verificar permisos
    const leadCheck = await client.query(
      'SELECT id, assigned_to FROM leads WHERE id = $1',
      [leadId]
    );

    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Lead no encontrado',
        message: `No existe un lead con el ID ${leadId}`
      });
    }

    const lead = leadCheck.rows[0];
    if (lead.assigned_to !== user_id && user_role !== 'admin' && user_role !== 'manager') {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        message: 'No tienes permisos para ver este lead. El lead debe estar asignado a tu usuario o debes tener rol de admin/manager.',
        details: {
          lead_id: leadId,
          assigned_to: lead.assigned_to,
          your_user_id: user_id,
          your_role: user_role
        }
      });
    }

    const result = await client.query(
      `SELECT c.*, u.name as user_name 
       FROM checkins c
       JOIN users u ON c.user_id = u.id
       WHERE c.lead_id = $1
       ORDER BY c.timestamp DESC`,
      [leadId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener check-ins del lead:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    client.release();
  }
};

export const autoCheckIn = async (req: Request & { user?: JwtPayload }, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Compatibilidad: location como objeto, string JSON, o campos planos
    let location: any = req.body.location;
    if (!location && req.body.latitude && req.body.longitude) {
      location = {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      };
    } else if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        location = undefined;
      }
    }

    const radius = req.body.radius ? Number(req.body.radius) : undefined;
    const notes = req.body.notes;
    const next_followup = req.body.next_followup;

    // Validar la ubicación
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number' || isNaN(location.latitude) || isNaN(location.longitude)) {
      res.status(400).json({ 
        error: 'Ubicación inválida',
        details: 'Se requiere latitud y longitud válidas'
      });
      return;
    }

    // Validar el radio si se proporciona
    if (radius !== undefined && (typeof radius !== 'number' || radius <= 0)) {
      res.status(400).json({ 
        error: 'Radio inválido',
        details: 'El radio debe ser un número positivo'
      });
      return;
    }

    // Validar la fecha de seguimiento si se proporciona
    if (next_followup !== undefined) {
      const followupDate = new Date(next_followup);
      if (isNaN(followupDate.getTime())) {
        res.status(400).json({
          error: 'Fecha de seguimiento inválida',
          details: 'La fecha debe tener un formato válido'
        });
        return;
      }
    }

    const result = await checkInService.processAutoCheckIn(Number(userId), {
      location,
      radius,
      notes,
      next_followup: next_followup ? new Date(next_followup) : undefined,
      files: (req.files as Express.Multer.File[]) || []
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          lead: result.lead,
          distance: result.distance,
          next_followup: result.next_followup
        }
      });
    } else {
      res.status(200).json({
        success: false,
        message: result.message,
        data: result.lead ? {
          lead: result.lead,
          distance: result.distance
        } : undefined
      });
    }

  } catch (error) {
    logger.error('Error en autoCheckIn:', error);
    res.status(500).json({ 
      error: 'Error al procesar el check-in automático',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}; 