import { Request, Response } from 'express';
import pool from '../db';
import { logger } from '../utils/logger';

export class UsersController {
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;

      const result = await pool.query(
        'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query(
        'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      logger.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
} 