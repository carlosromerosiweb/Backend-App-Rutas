import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { logger } from '../utils/logger';

/**
 * Obtiene todos los usuarios con paginación
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await userService.getUsers(page, limit);

    res.json({
      success: true,
      data: result.users,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    logger.error('Error en getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los usuarios'
    });
  }
}; 