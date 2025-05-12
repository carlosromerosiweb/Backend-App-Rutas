import { Request, Response } from 'express';
import { checkInService } from '../services/checkin.service';
import { AutoCheckInRequest } from '../types/checkin.types';
import { logger } from '../utils/logger';
import { JwtPayload } from '../types';
import { upload } from '../services/file.service';

export const autoCheckIn = async (req: Request & { user?: JwtPayload }, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    // Compatibilidad: location como objeto, string JSON, o campos planos
    let location: any = req.body.location;
    if (!location && req.body.latitude && req.body.longitude) {
      location = {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      };
    } else if (typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        location = undefined;
      }
    }

    const radius = req.body.radius ? Number(req.body.radius) : undefined;
    const notes = req.body.notes;
    const next_followup = req.body.next_followup;

    // Validar la ubicación
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number' || isNaN(location.latitude) || isNaN(location.longitude)) {
      res.status(400).json({ 
        error: 'Ubicación inválida',
        details: 'Se requiere latitud y longitud válidas'
      });
      return;
    }

    // Validar el radio si se proporciona
    if (radius !== undefined && (typeof radius !== 'number' || radius <= 0)) {
      res.status(400).json({ 
        error: 'Radio inválido',
        details: 'El radio debe ser un número positivo'
      });
      return;
    }

    // Validar la fecha de seguimiento si se proporciona
    if (next_followup !== undefined) {
      const followupDate = new Date(next_followup);
      if (isNaN(followupDate.getTime())) {
        res.status(400).json({
          error: 'Fecha de seguimiento inválida',
          details: 'La fecha debe tener un formato válido'
        });
        return;
      }
    }

    const result = await checkInService.processAutoCheckIn(Number(userId), {
      location,
      radius,
      notes,
      next_followup: next_followup ? new Date(next_followup) : undefined,
      files: (req.files as Express.Multer.File[]) || []
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          lead: result.lead,
          distance: result.distance,
          next_followup: result.next_followup
        }
      });
    } else {
      res.status(200).json({
        success: false,
        message: result.message,
        data: result.lead ? {
          lead: result.lead,
          distance: result.distance
        } : undefined
      });
    }

  } catch (error) {
    logger.error('Error en autoCheckIn:', error);
    res.status(500).json({ 
      error: 'Error al procesar el check-in automático',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}; 