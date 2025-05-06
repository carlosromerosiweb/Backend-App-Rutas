import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Crear una nueva nota para un lead
export const createNota = async (req: Request, res: Response) => {
  try {
    const nota = {
      lead_id: req.params.leadId,
      usuario_id: req.user?.userId,
      contenido: req.body.contenido
    };
    const { data, error } = await supabase
      .from('notas')
      .insert([nota])
      .select();
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Listar todas las notas de un lead
export const getNotasByLead = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .eq('lead_id', req.params.leadId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}; 