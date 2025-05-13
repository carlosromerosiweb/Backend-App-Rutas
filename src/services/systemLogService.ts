import pool from '../db';

interface SystemLogEntry {
  user_id: number;
  action: string;
  details: Record<string, any>;
}

export class SystemLogService {
  async create(entry: SystemLogEntry): Promise<void> {
    try {
      await pool.query(
        'INSERT INTO system_logs (user_id, action, details, created_at) VALUES ($1, $2, $3, NOW())',
        [entry.user_id, entry.action, JSON.stringify(entry.details)]
      );
    } catch (error) {
      console.error('Error al crear log del sistema:', error);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }
} 