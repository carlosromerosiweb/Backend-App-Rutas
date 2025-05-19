import { Request, Response } from 'express';
import { importGeocodeService } from '../services/importGeocode.service';
import { logger } from '../utils/logger';

/**
 * Importa leads desde un archivo CSV y los geocodifica
 */
export const importAndGeocodeLeadsFromCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    // El archivo ya debería estar guardado por multer en req.file
    if (!req.file) {
      res.status(400).json({
        error: 'Archivo no proporcionado',
        message: 'No se ha proporcionado ningún archivo CSV para importar'
      });
      return;
    }

    // Obtener el ID del usuario al que asignar los leads por defecto
    const defaultAssignedTo = req.body.default_assigned_to ? 
      parseInt(req.body.default_assigned_to) : undefined;

    // Importar y geocodificar leads desde el CSV
    const stats = await importGeocodeService.importAndGeocodeLeadsFromCsv(
      req.file.path,
      defaultAssignedTo
    );

    // Generar mensaje de éxito
    res.status(200).json({
      message: 'Importación y geocodificación completadas',
      stats: {
        total: stats.total,
        success: stats.success,
        failed: stats.failed
      },
      errors: stats.errors
    });
  } catch (error) {
    logger.error('Error al importar y geocodificar leads desde CSV:', error);
    
    res.status(500).json({
      error: 'Error al procesar la importación',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}; 