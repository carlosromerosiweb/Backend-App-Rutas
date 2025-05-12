import { Request, Response } from 'express';
import { OfflineSyncService } from '../services/offline-sync.service';
import { offlineSyncSchema } from '../types/offline-sync';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export class OfflineSyncController {
  private syncService: OfflineSyncService;

  constructor() {
    this.syncService = new OfflineSyncService();
  }

  async syncOfflineData(req: Request, res: Response): Promise<void> {
    try {
      // Validar el payload con Zod
      const validatedData = offlineSyncSchema.parse(req.body);

      // Obtener el ID del usuario del token JWT
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
        });
        return;
      }

      // Verificar rol del usuario
      const userRole = req.user?.role;
      if (!userRole || !['comercial', 'manager', 'admin'].includes(userRole)) {
        res.status(403).json({
          success: false,
          error: 'No tienes permisos para realizar esta acción',
        });
        return;
      }

      // Procesar la sincronización
      const result = await this.syncService.syncOfflineData(validatedData, userId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error en el controlador de sincronización offline:', error);

      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Datos de sincronización inválidos',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
      });
    }
  }
} 