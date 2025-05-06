import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

// Extender la interfaz Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

// Validación de login
export const validateLogin = [
  (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    next();
  }
];

// Validación de registro
export const validateRegister = [
  (req: Request, res: Response, next: NextFunction) => {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (!['comercial', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    next();
  }
];

// Middleware de autenticación
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware de autorización por rol
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }

    next();
  };
};

// Validación de visitas
export const validateVisit = [
  (req: Request, res: Response, next: NextFunction) => {
    const { lead_id, latitud, longitud, notas, foto_url, estado_post_visita } = req.body;
    
    if (!lead_id || !latitud || !longitud || !notas || !foto_url || !estado_post_visita) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    next();
  }
];