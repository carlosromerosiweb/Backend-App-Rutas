import { Request, Response, RequestHandler } from 'express';
import pool from '../db';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Calcula el rango de fechas basado en el parámetro range
 */
const getDateRange = (range: string): DateRange => {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1); // Por defecto, último mes
  }

  return { start, end };
};

/**
 * Obtiene un resumen de rendimiento para un usuario o todos los usuarios
 */
export const getPerformanceSummary: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const { userId, range = 'month' } = req.query;
    const { start, end } = getDateRange(range as string);
    const userRole = (req as AuthenticatedRequest).user?.role;
    const requestingUserId = (req as AuthenticatedRequest).user?.userId;

    // Validar permisos
    if (userId && userRole === 'comercial' && Number(userId) !== Number(requestingUserId)) {
      res.status(403).json({ 
        error: 'No tienes permisos para ver reportes de otros usuarios' 
      });
      return;
    }

    // Construir la consulta base
    let query = `
      WITH lead_stats AS (
        SELECT 
          l.assigned_to,
          COUNT(*) as total_leads,
          COUNT(CASE WHEN l.status = 'ganado' THEN 1 END) as leads_ganados,
          COUNT(CASE WHEN l.status = 'perdido' THEN 1 END) as leads_perdidos,
          COUNT(CASE WHEN l.status = 'seguimiento' THEN 1 END) as leads_seguimiento,
          COUNT(CASE WHEN l.status = 'nuevo' THEN 1 END) as leads_nuevos,
          COUNT(CASE WHEN l.next_followup > NOW() THEN 1 END) as leads_con_seguimiento
        FROM leads l
        WHERE l.created_at BETWEEN $1 AND $2
        ${userId ? 'AND l.assigned_to = $3' : ''}
        GROUP BY l.assigned_to
      ),
      checkin_stats AS (
        SELECT 
          c.user_id,
          COUNT(*) as total_checkins,
          MAX(c.timestamp) as ultimo_checkin
        FROM checkins c
        WHERE c.timestamp BETWEEN $1 AND $2
        ${userId ? 'AND c.user_id = $3' : ''}
        GROUP BY c.user_id
      )
      SELECT 
        u.id,
        u.name,
        COALESCE(ls.total_leads, 0) as total_leads,
        COALESCE(ls.leads_ganados, 0) as leads_ganados,
        COALESCE(ls.leads_perdidos, 0) as leads_perdidos,
        COALESCE(ls.leads_seguimiento, 0) as leads_seguimiento,
        COALESCE(ls.leads_nuevos, 0) as leads_nuevos,
        COALESCE(cs.total_checkins, 0) as total_checkins,
        COALESCE(cs.ultimo_checkin, NULL) as ultimo_checkin,
        COALESCE(ls.leads_con_seguimiento, 0) as leads_con_seguimiento,
        CASE 
          WHEN COALESCE(ls.total_leads, 0) > 0 
          THEN CAST(ROUND(CAST(COALESCE(ls.leads_ganados, 0) AS NUMERIC) / CAST(COALESCE(ls.total_leads, 0) AS NUMERIC) * 100, 2) AS NUMERIC)
          ELSE 0 
        END as ratio_conversion
      FROM users u
      LEFT JOIN lead_stats ls ON u.id = ls.assigned_to
      LEFT JOIN checkin_stats cs ON u.id = cs.user_id
      WHERE u.role = 'comercial'
      ${userId ? 'AND u.id = $3' : ''}
      ORDER BY u.name
    `;

    const params = [start.toISOString(), end.toISOString()];
    if (userId) {
      params.push(userId as string);
    }

    const result = await client.query(query, params);

    // Transformar los resultados
    const summary = result.rows.map(row => ({
      user_id: row.id,
      user_name: row.name,
      metrics: {
        total_leads: parseInt(row.total_leads),
        leads_ganados: parseInt(row.leads_ganados),
        leads_perdidos: parseInt(row.leads_perdidos),
        leads_seguimiento: parseInt(row.leads_seguimiento),
        leads_nuevos: parseInt(row.leads_nuevos),
        total_checkins: parseInt(row.total_checkins),
        ultimo_checkin: row.ultimo_checkin,
        leads_con_seguimiento: parseInt(row.leads_con_seguimiento),
        ratio_conversion: parseFloat(row.ratio_conversion)
      }
    }));

    res.json({
      range: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      summary: userId ? summary[0] : summary
    });

  } catch (error) {
    logger.error('Error al obtener resumen de rendimiento:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al obtener el resumen de rendimiento' 
    });
  } finally {
    client.release();
  }
}; 