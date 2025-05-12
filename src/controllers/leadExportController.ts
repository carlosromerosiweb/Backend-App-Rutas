import { Request, Response } from 'express';
import pool from '../db';
import { createObjectCsvWriter } from 'csv-writer';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// Esquema de validación para los parámetros de consulta
const exportQuerySchema = z.object({
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  status: z.string().optional(),
  assigned_to: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
});

export const exportLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar parámetros de consulta
    const queryParams = exportQuerySchema.parse(req.query);

    // Construir la consulta base
    let query = `
      SELECT 
        id, name, email, phone, address, city, postal_code, country,
        type, status, priority, estimated_value, created_at,
        last_contact, next_followup, category, rating,
        latitude, longitude, assigned_to
      FROM leads
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Aplicar filtros
    if (queryParams.created_from) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(new Date(queryParams.created_from));
      paramIndex++;
    }
    if (queryParams.created_to) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(new Date(queryParams.created_to));
      paramIndex++;
    }
    if (queryParams.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(queryParams.status);
      paramIndex++;
    }
    if (queryParams.assigned_to) {
      query += ` AND assigned_to = $${paramIndex}`;
      params.push(parseInt(queryParams.assigned_to));
      paramIndex++;
    }
    if (queryParams.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(queryParams.type);
      paramIndex++;
    }
    if (queryParams.priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(queryParams.priority);
      paramIndex++;
    }

    // Ejecutar la consulta
    const result = await pool.query(query, params);
    const leadsData = result.rows;

    // Verificar si hay datos
    if (leadsData.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No se encontraron leads con los filtros especificados'
      });
      return;
    }

    // Verificar límite de registros
    if (leadsData.length > 10000) {
      res.status(400).json({
        success: false,
        message: 'La exportación excede el límite de 10,000 registros'
      });
      return;
    }

    // Crear directorio de exportación si no existe
    const exportDir = path.join(__dirname, '../../exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir);
    }

    // Generar nombre de archivo único
    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const filename = `leads-export-${timestamp}.csv`;
    const filepath = path.join(exportDir, filename);

    // Configurar el escritor CSV
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'ID' },
        { id: 'name', title: 'Nombre' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Teléfono' },
        { id: 'address', title: 'Dirección' },
        { id: 'city', title: 'Ciudad' },
        { id: 'postal_code', title: 'Código Postal' },
        { id: 'country', title: 'País' },
        { id: 'type', title: 'Tipo' },
        { id: 'status', title: 'Estado' },
        { id: 'priority', title: 'Prioridad' },
        { id: 'estimated_value', title: 'Valor Estimado' },
        { id: 'created_at', title: 'Fecha de Creación' },
        { id: 'last_contact', title: 'Último Contacto' },
        { id: 'next_followup', title: 'Próximo Seguimiento' },
        { id: 'category', title: 'Categoría' },
        { id: 'rating', title: 'Calificación' },
        { id: 'latitude', title: 'Latitud' },
        { id: 'longitude', title: 'Longitud' }
      ]
    });

    // Escribir datos al CSV
    await csvWriter.writeRecords(leadsData);

    // Registrar la exportación en system_logs
    if (req.user) {
      await pool.query(
        `INSERT INTO system_logs 
        (user_id, action, entity, message, metadata, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          req.user.userId,
          'export_leads',
          'leads',
          `Exportación de leads realizada por ${req.user.email}`,
          JSON.stringify(queryParams),
          'success',
          new Date(),
          new Date()
        ]
      );
    }

    // Enviar el archivo
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error al enviar el archivo:', err);
      }
      // Eliminar el archivo después de enviarlo
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error al eliminar el archivo temporal:', unlinkErr);
        }
      });
    });

  } catch (error) {
    console.error('Error en la exportación de leads:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error al exportar los leads'
    });
  }
}; 