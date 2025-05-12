/**
 * Utilidad para logging en toda la aplicación
 */

import { Request } from 'express';
import pool from '../db';
import { JwtPayload } from '../types';
import winston from 'winston';

interface LogActionParams {
    action: string;
    entity: string;
    entityId?: string;
    message: string;
    status: 'success' | 'error';
    metadata?: Record<string, any>;
    req?: Request;
}

export const logAction = async ({
    action,
    entity,
    entityId,
    message,
    status,
    metadata,
    req
}: LogActionParams): Promise<void> => {
    try {
        // Obtener userId del usuario autenticado
        let userId: string | null = null;
        if (req?.user) {
            const user = req.user as JwtPayload;
            userId = user.userId?.toString() || null;
        }

        const ipAddress = req?.ip || req?.socket.remoteAddress;

        console.log('Intentando registrar log:', {
            userId,
            action,
            entity,
            entityId,
            message,
            status,
            metadata
        });

        const result = await pool.query(
            `INSERT INTO system_logs 
            (user_id, action, entity, entity_id, message, ip_address, status, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id`,
            [userId, action, entity, entityId, message, ipAddress, status, metadata ? JSON.stringify(metadata) : null]
        );

        console.log('Log registrado exitosamente:', result.rows[0]);
    } catch (error) {
        console.error('Error al registrar log:', error);
        // No lanzamos el error para no interrumpir el flujo principal
    }
};

// Configuración del logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Si no estamos en producción, también mostramos los logs en consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export { logger };