import pool from '../db';
import { RouteOptimizationLog } from '../types/systemLog.types';

export class SystemLogService {
  async logRouteOptimization(log: RouteOptimizationLog): Promise<void> {
    const query = `
      INSERT INTO system_logs (
        user_id,
        action,
        entity,
        status,
        message,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const metadata = {
      type: 'route_optimization',
      date: log.date,
      leadsProcessed: log.leadsProcessed,
      totalDistance: log.totalDistance,
      totalDuration: log.totalDuration
    };

    await pool.query(query, [
      log.userId,
      'ROUTE_OPTIMIZATION',
      'ROUTE',
      'success',
      `Optimización de ruta completada para ${log.leadsProcessed} leads`,
      JSON.stringify(metadata),
      new Date()
    ]);
  }
} 