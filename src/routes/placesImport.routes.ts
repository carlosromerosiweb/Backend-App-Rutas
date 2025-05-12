import { Router } from 'express';
import { PlacesImportController } from '../controllers/placesImport.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
const placesImportController = new PlacesImportController();

/**
 * @route POST /api/leads/import/places
 * @desc Importa leads desde Google Places API
 * @access Privado (requiere autenticación y rol admin/manager)
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  placesImportController.importPlaces
);

export default router; 