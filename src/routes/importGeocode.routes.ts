import { Router } from 'express';
import { authenticate, checkPermission } from '../middlewares/auth';
import { Resource, Action } from '../config/permissions';
import { importAndGeocodeLeadsFromCsv } from '../controllers/importGeocode.controller';
import { upload } from '../controllers/import';

const router = Router();

/**
 * @route POST /api/import/leads/geocode
 * @desc Importa leads desde un archivo CSV y los geocodifica automáticamente
 * @access Privado (requiere autenticación y permisos de admin/manager)
 */
router.post(
  '/leads/geocode',
  authenticate,
  checkPermission(Resource.LEADS, Action.CREATE),
  upload.single('file'),
  importAndGeocodeLeadsFromCsv
);

export default router; 