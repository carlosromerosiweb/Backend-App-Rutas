import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/error';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      errors: error.errors
    });
    return;
  }

  // Error no manejado
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
}; 