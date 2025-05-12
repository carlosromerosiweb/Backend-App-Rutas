import { Request, Response, NextFunction } from 'express';

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Autenticación requerida' });
      return;
    }

    // Convertir ambos a minúsculas para comparación case-insensitive
    const userRole = req.user.role.toLowerCase();
    const hasRole = allowedRoles.some(role => role.toLowerCase() === userRole);

    if (!hasRole) {
      res.status(403).json({ message: 'Permisos insuficientes' });
      return;
    }

    next();
  };
}; 