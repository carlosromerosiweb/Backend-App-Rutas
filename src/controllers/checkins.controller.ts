import { Request, Response } from 'express';
import pool from '../db';
import { JwtPayload } from '../types';

interface CheckinRequest {
  lead_id: number;
  location_lat?: number;
  location_lng?: number;
  status: 'nuevo' | 'seguimiento' | 'ganado' | 'perdido';
  notes?: string;
  attachment_url?: string;
}

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export const createCheckin = async (req: AuthenticatedRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { lead_id, location_lat, location_lng, status, notes, attachment_url } = req.body as CheckinRequest;
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
        status, notes, attachment_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [user_id, lead_id, location_lat, location_lng, status, notes, attachment_url]
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
    const { leadId } = req.params;
    const user_id = req.user.userId;
    const user_role = req.user.role;

    // Verificar permisos
    const leadCheck = await client.query(
      'SELECT id FROM leads WHERE id = $1 AND (assigned_to = $2 OR $3 IN (\'admin\', \'manager\'))',
      [leadId, user_id, user_role]
    );

    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Lead no encontrado o no tienes permisos para verlo' 
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