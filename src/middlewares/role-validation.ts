import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const validateRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
        });
        return;
      }

      if (!allowedRoles.includes(userRole)) {
        logger.warn(`Intento de acceso no autorizado: usuario ${req.user?.id} con rol ${userRole}`);
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para realizar esta acción',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error en validación de rol:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  };
}; 