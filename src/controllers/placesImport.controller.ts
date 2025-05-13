import { Request, Response } from 'express';
import { PlacesImportService } from '../services/placesImport.service';
import { logger } from '../utils/logger';

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
} 