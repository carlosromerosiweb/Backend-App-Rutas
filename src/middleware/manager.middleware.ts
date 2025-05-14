import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const managerRoleMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const userRole = req.user?.role?.toLowerCase();

  if (!userRole || !['manager', 'admin'].includes(userRole)) {
    logger.warn('Intento de acceso no autorizado al dashboard de manager', {
      userId: req.user?.id,
      userRole,
      timestamp: new Date().toISOString(),
    });
    res.status(403).json({ error: 'No tienes permiso para acceder a esta funcionalidad' });
    return;
  }

  next();
}; 