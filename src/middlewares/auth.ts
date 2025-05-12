import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import { Resource, Action, hasPermission, canAccessRoute } from '../config/permissions';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and protect routes
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ message: 'Autenticación requerida' });
      return;
    }

    // Check if the header has the correct format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ message: 'Formato de autenticación inválido' });
      return;
    }

    const token = parts[1];

    // Verify the token
    const decoded = jwt.verify(token, config.jwtSecret as jwt.Secret) as JwtPayload;
    
    // Set the user object in the request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Token inválido' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expirado' });
    } else {
      res.status(500).json({ message: 'Error interno del servidor durante la autenticación' });
    }
  }
};

/**
 * Middleware para verificar si el usuario tiene un rol específico
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Autenticación requerida' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Permisos insuficientes' });
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar si el usuario tiene permiso para realizar una acción
 * sobre un recurso específico
 */
export const checkPermission = (resource: Resource, action: Action) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Autenticación requerida' });
      return;
    }

    const userRole = req.user.role;
    
    if (!hasPermission(userRole, resource, action)) {
      res.status(403).json({ 
        message: `No tienes permiso para ${action} en ${resource}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar si el usuario puede acceder a una ruta específica
 * basado en el mapeo de rutas a recursos y acciones
 */
export const checkRouteAccess = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Autenticación requerida' });
      return;
    }

    const userRole = req.user.role;
    const path = req.path;
    const method = req.method;
    
    if (!canAccessRoute(userRole, path, method)) {
      res.status(403).json({ 
        message: 'No tienes permiso para acceder a esta ruta'
      });
      return;
    }

    next();
  };
};
