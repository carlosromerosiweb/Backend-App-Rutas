import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import { AppError } from '../utils/error';

export const authMiddleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Token de autenticación no proporcionado', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expirado', 401));
    } else {
      next(error);
    }
  }
}; 