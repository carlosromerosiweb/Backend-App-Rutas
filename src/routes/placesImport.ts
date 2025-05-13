import express, { Request, Response } from 'express';
import { PlacesImportController } from '../controllers/placesImportController';
import { authenticate } from '../middlewares/auth';
import { PlacesImportSchema } from '../types/placesImport';
import { JwtPayload } from '../types';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

const router = express.Router();
const placesImportController = new PlacesImportController();

// Ruta principal para importar lugares
router.post('/import/places', authenticate, async (req: RequestWithUser, res: Response) => {
  await placesImportController.importPlaces(req, res);
});

// Ruta de prueba para importar lugares
router.get('/test-import', authenticate, async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    // Verificar rol de admin
    if (!req.user || req.user.role.toLowerCase() !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden importar lugares'
      });
      return;
    }

    // Datos de prueba
    const testData = {
      latitude: 40.416775,
      longitude: -3.703790,
      radius: 1000,
      rating_min: 4.0,
      open_now: true,
      categories: ['restaurant'],
      keywords: 'pizza',
      maxResults: 10
    };

    // Validar datos de prueba
    const validatedData = PlacesImportSchema.parse(testData);

    // Crear un objeto request simulado
    const mockReq = {
      ...req,
      body: validatedData,
      user: req.user
    } as RequestWithUser;

    // Llamar al controlador con los datos de prueba
    await placesImportController.importPlaces(mockReq, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router; 