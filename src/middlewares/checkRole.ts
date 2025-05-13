import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { JwtPayload } from '../types';

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as JwtPayload;
      
      if (!user) {
        throw new AppError('Usuario no autenticado', 401);
      }

      if (!allowedRoles.includes(user.role)) {
        throw new AppError('No tienes permisos para acceder a este recurso', 403);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor'
        });
      }
    }
  };
}; 