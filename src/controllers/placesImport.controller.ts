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
      const { query, location, maxResults } = req.body;

      // Validar parámetros requeridos
      if (!query || !location) {
        res.status(400).json({
          error: 'Parámetros inválidos',
          message: 'Se requieren los parámetros query y location'
        });
        return;
      }

      // Validar maxResults si se proporciona
      const maxResultsNumber = maxResults ? parseInt(maxResults) : 20;
      if (maxResults && (isNaN(maxResultsNumber) || maxResultsNumber < 1 || maxResultsNumber > 50)) {
        res.status(400).json({
          error: 'Parámetro inválido',
          message: 'maxResults debe ser un número entre 1 y 50'
        });
        return;
      }

      const result = await this.placesImportService.importPlaces(
        query,
        location,
        maxResultsNumber
      );

      res.json({
        message: 'Importación completada',
        ...result
      });
    } catch (error) {
      logger.error('Error en importación de lugares:', error);
      
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
        } else {
          errorMessage = error.message;
        }
      }

      res.status(statusCode).json({
        error: 'Error en importación de lugares',
        message: errorMessage
      });
    }
  };
} 