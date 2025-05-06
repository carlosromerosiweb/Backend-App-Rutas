import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Crear una nueva visita
export const createVisita = async (req: Request, res: Response) => {
  try {
    const visita = {
      lead_id: req.body.lead_id,
      usuario_id: req.user?.userId,
      fecha_hora: req.body.fecha_hora || new Date().toISOString(),
      latitud: req.body.latitud,
      longitud: req.body.longitud,
      notas: req.body.notas,
      foto_url: req.body.foto_url,
      estado_post_visita: req.body.estado_post_visita
    };
    const { data, error } = await supabase
      .from('visitas')
      .insert([visita])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Listar todas las visitas (con filtros opcionales)
export const getVisitas = async (req: Request, res: Response) => {
  try {
    let query = supabase.from('visitas').select('*');
    if (req.query.lead_id) {
      query = query.eq('lead_id', req.query.lead_id);
    }
    if (req.query.usuario_id) {
      query = query.eq('usuario_id', req.query.usuario_id);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener detalles de una visita
export const getVisitaById = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('visitas')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Visita no encontrada' });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Listar visitas de un lead
export const getVisitasByLead = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('visitas')
      .select('*')
      .eq('lead_id', req.params.leadId);
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Listar visitas de un usuario
export const getVisitasByUsuario = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('visitas')
      .select('*')
      .eq('usuario_id', req.params.userId);
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}; 