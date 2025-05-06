import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export const importLeadsFromCSV = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo CSV' });
  }

  const leads: any[] = [];
  const errors: any[] = [];

  try {
    // Parsear el CSV
    parse(req.file.buffer, { columns: true, skip_empty_lines: true }, async (err, records) => {
      if (err) {
        return res.status(400).json({ error: 'Error al procesar el archivo CSV', details: err.message });
      }

      // Validar y preparar los leads
      for (const [i, row] of records.entries()) {
        // Validación básica (puedes mejorarla según tus campos obligatorios)
        if (!row.nombre || !row.telefono || !row.estado) {
          errors.push({ fila: i + 2, error: 'Faltan campos obligatorios (nombre, telefono, estado)' });
          continue;
        }
        leads.push({
          nombre: row.nombre,
          direccion: row.direccion || '',
          telefono: row.telefono,
          categoria: row.categoria || '',
          rating: row.rating ? parseFloat(row.rating) : null,
          horarios: row.horarios || '',
          latitud: row.latitud ? parseFloat(row.latitud) : null,
          longitud: row.longitud ? parseFloat(row.longitud) : null,
          estado: row.estado,
          notas: row.notas || '',
          foto_url: row.foto_url || '',
          asignado_a: row.asignado_a || null
        });
      }

      // Insertar en la base de datos
      if (leads.length > 0) {
        const { data, error } = await supabase
          .from('leads')
          .insert(leads)
          .select();
        if (error) {
          return res.status(500).json({ error: 'Error al insertar leads', details: error.message });
        }
        return res.json({ mensaje: 'Importación completada', insertados: data.length, errores: errors });
      } else {
        return res.status(400).json({ error: 'No se insertó ningún lead', errores: errors });
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error inesperado', details: error.message });
  }
}; 