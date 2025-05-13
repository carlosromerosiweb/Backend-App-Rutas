import { Request, Response } from 'express';
import { PlacesImportService } from '../services/placesImportService';
import { PlacesImportSchema } from '../types/placesImport';
import { UnauthorizedError } from '../utils/errors';
import { JwtPayload } from '../types';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

export class PlacesImportController {
  private placesImportService: PlacesImportService;

  constructor() {
    this.placesImportService = new PlacesImportService();
  }

  async importPlaces(req: RequestWithUser, res: Response) {
    try {
      // Verificar rol de admin
      if (!req.user || req.user.role.toLowerCase() !== 'admin') {
        throw new UnauthorizedError('Solo los administradores pueden importar lugares');
      }

      // Validar y parsear el body
      const validatedData = PlacesImportSchema.parse(req.body);

      // Importar lugares
      const result = await this.placesImportService.importPlaces(
        parseInt(req.user.userId),
        validatedData
      );

      res.json(result);
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        res.status(403).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
} 