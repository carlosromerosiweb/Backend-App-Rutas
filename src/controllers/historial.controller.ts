import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Listar historial de cambios de estado de un lead
export const getHistorialByLead = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('historial_estados')
      .select('*')
      .eq('lead_id', req.params.leadId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}; 