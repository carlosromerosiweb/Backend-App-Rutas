import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Crear un nuevo lead
export const createLead = async (req: Request, res: Response) => {
  try {
    const lead = {
      nombre: req.body.nombre,
      direccion: req.body.direccion,
      telefono: req.body.telefono,
      categoria: req.body.categoria,
      rating: req.body.rating,
      horarios: req.body.horarios,
      latitud: req.body.latitud,
      longitud: req.body.longitud,
      estado: req.body.estado,
      notas: req.body.notas,
      foto_url: req.body.foto_url,
      asignado_a: req.body.asignado_a
    };
    const { data, error } = await supabase
      .from('leads')
      .insert([lead])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los leads
export const getLeads = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*');

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un lead por ID
export const getLeadById = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Lead no encontrado' });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un lead
export const updateLead = async (req: Request, res: Response) => {
  try {
    // Obtener el lead actual antes de actualizar
    const { data: currentLead, error: getError } = await supabase
      .from('leads')
      .select('estado')
      .eq('id', req.params.id)
      .single();
    if (getError || !currentLead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    const { data, error } = await supabase
      .from('leads')
      .update(req.body)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Lead no encontrado' });

    // Si el estado cambió, registrar en historial_estados
    if (req.body.estado && req.body.estado !== currentLead.estado) {
      await supabase
        .from('historial_estados')
        .insert([
          {
            lead_id: req.params.id,
            usuario_id: req.user?.userId,
            estado_anterior: currentLead.estado,
            estado_nuevo: req.body.estado,
            motivo: req.body.motivo || null
          }
        ]);
    }

    res.json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un lead
export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Asignar un lead a un usuario
export const assignLead = async (req: Request, res: Response) => {
  try {
    const { asignado_a } = req.body;
    
    const { data, error } = await supabase
      .from('leads')
      .update({ asignado_a })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Lead no encontrado' });

    res.json(data[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener leads por usuario
export const getLeadsByUser = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('asignado_a', req.params.userId);

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}; 