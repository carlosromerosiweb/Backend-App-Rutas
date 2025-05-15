import { Request, Response } from 'express';
import { PlacesImportService } from '../services/placesImport.service';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { logAction } from '../utils/logger';

const detailedImportSchema = z.object({
  keyword: z.string().optional(),
  type: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  radius: z.number().min(0).max(50000).optional().default(5000),
  rating_min: z.number().min(0).max(5).optional(),
  open_now: z.boolean().optional(),
  maxResults: z.number().min(1).max(50).optional().default(20)
});

export class PlacesImportController {
  private placesImportService: PlacesImportService;

  constructor() {
    this.placesImportService = new PlacesImportService();
  }

  importPlaces = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Iniciando importación de lugares', {
        body: req.body,
        headers: req.headers,
        user: req.user
      });

      const { query, location, maxResults } = req.body;

      // Validar parámetros requeridos
      if (!query || !location) {
        logger.warn('Parámetros inválidos en la solicitud', { query, location });
        res.status(400).json({
          error: 'Parámetros inválidos',
          message: 'Se requieren los parámetros query y location'
        });
        return;
      }

      // Validar maxResults si se proporciona
      const maxResultsNumber = maxResults ? parseInt(maxResults) : 20;
      if (maxResults && (isNaN(maxResultsNumber) || maxResultsNumber < 1 || maxResultsNumber > 50)) {
        logger.warn('Valor inválido para maxResults', { maxResults, maxResultsNumber });
        res.status(400).json({
          error: 'Parámetro inválido',
          message: 'maxResults debe ser un número entre 1 y 50'
        });
        return;
      }

      logger.info('Llamando al servicio de importación', {
        query,
        location,
        maxResults: maxResultsNumber
      });

      const result = await this.placesImportService.importPlaces(
        query,
        location,
        maxResultsNumber
      );

      logger.info('Importación completada exitosamente', {
        imported: result.imported,
        skipped: result.skipped,
        totalResults: result.data.length
      });

      res.json({
        message: 'Importación completada',
        ...result
      });
    } catch (error) {
      logger.error('Error en importación de lugares:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        requestBody: req.body,
        requestHeaders: req.headers,
        userId: req.user?.userId
      });
      
      // Determinar el código de estado apropiado
      let statusCode = 500;
      let errorMessage = 'Error desconocido';

      if (error instanceof Error) {
        if (error.message.includes('REQUEST_DENIED')) {
          statusCode = 500;
          errorMessage = 'Error de configuración de la API de Google Maps';
          logger.error('Error de API de Google Maps - REQUEST_DENIED', {
            error: error.message,
            apiKey: process.env.GOOGLE_MAPS_API_KEY ? 'Presente' : 'No presente'
          });
        } else if (error.message.includes('OVER_QUERY_LIMIT')) {
          statusCode = 429;
          errorMessage = 'Se ha excedido el límite de peticiones a la API de Google Maps';
          logger.error('Error de API de Google Maps - OVER_QUERY_LIMIT');
        } else if (error.message.includes('ZERO_RESULTS')) {
          statusCode = 404;
          errorMessage = 'No se encontraron resultados para la búsqueda';
          logger.warn('No se encontraron resultados para la búsqueda', {
            query: req.body.query,
            location: req.body.location
          });
        } else if (error.message.includes('INVALID_REQUEST')) {
          statusCode = 400;
          errorMessage = 'La búsqueda proporcionada no es válida';
          logger.warn('Búsqueda inválida', {
            query: req.body.query,
            location: req.body.location
          });
        } else {
          errorMessage = error.message;
        }
      }

      res.status(statusCode).json({
        error: 'Error en importación de lugares',
        message: errorMessage,
        details: error instanceof Error ? error.message : undefined
      });
    }
  };

  detailedImport = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Iniciando importación detallada de lugares', {
        body: req.body,
        headers: req.headers,
        user: req.user
      });

      // Validar y parsear parámetros
      const params = detailedImportSchema.parse(req.body);

      // Llamar al servicio
      const result = await this.placesImportService.detailedImport(params);

      // Registrar en system_logs
      await logAction({
        action: 'LEADS_DETAILED_IMPORT',
        entity: 'LEAD',
        message: `Importación detallada completada: ${result.imported} importados, ${result.skipped} omitidos`,
        status: 'success',
        metadata: {
          params,
          result
        },
        req
      });

      logger.info('Importación detallada completada exitosamente', {
        imported: result.imported,
        skipped: result.skipped,
        totalResults: result.data.length
      });

      res.json({
        message: 'Importación detallada completada',
        ...result
      });
    } catch (error) {
      logger.error('Error en importación detallada de lugares:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        requestBody: req.body,
        requestHeaders: req.headers,
        userId: req.user?.userId
      });

      // Registrar error en system_logs
      await logAction({
        action: 'LEADS_DETAILED_IMPORT',
        entity: 'LEAD',
        message: `Error en importación detallada: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        status: 'error',
        metadata: {
          error: error instanceof Error ? {
            message: error.message,
            name: error.name
          } : error,
          requestBody: req.body
        },
        req
      });
      
      // Determinar el código de estado apropiado
      let statusCode = 500;
      let errorMessage = 'Error desconocido';

      if (error instanceof Error) {
        if (error.message.includes('REQUEST_DENIED')) {
          statusCode = 500;
          errorMessage = 'Error de configuración de la API de Google Maps';
        } else if (error.message.includes('OVER_QUERY_LIMIT')) {
          statusCode = 429;
          errorMessage = 'Se ha excedido el límite de peticiones a la API de Google Maps';
        } else if (error.message.includes('ZERO_RESULTS')) {
          statusCode = 404;
          errorMessage = 'No se encontraron resultados para la búsqueda';
        } else if (error.message.includes('INVALID_REQUEST')) {
          statusCode = 400;
          errorMessage = 'La búsqueda proporcionada no es válida';
        } else if (error instanceof z.ZodError) {
          statusCode = 400;
          errorMessage = 'Parámetros de entrada inválidos';
        } else {
          errorMessage = error.message;
        }
      }

      res.status(statusCode).json({
        error: errorMessage,
        details: error instanceof Error ? error.message : undefined
      });
    }
  };
} 