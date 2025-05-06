import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateLead = [
  // Validación de campos requeridos según la tabla real
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('telefono').notEmpty().withMessage('El teléfono es requerido'),
  body('estado').notEmpty().withMessage('El estado es requerido'),
  body('latitud').optional().isFloat().withMessage('La latitud debe ser un número'),
  body('longitud').optional().isFloat().withMessage('La longitud debe ser un número'),
  body('rating').optional().isFloat().withMessage('El rating debe ser un número'),
  // Middleware para manejar los resultados de la validación
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
]; 