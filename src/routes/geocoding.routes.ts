import { Router } from 'express';
import { authenticate, checkPermission } from '../middlewares/auth';
import { Resource, Action } from '../config/permissions';
import { geocodeLead } from '../controllers/geocoding.controller';

const router = Router();

/**
 * @route POST /api/geocode/lead/:id
 * @desc Geocodifica la dirección de un lead y actualiza sus coordenadas
 * @access Privado (requiere autenticación y permisos de admin/manager)
 */
router.post(
  '/lead/:id',
  authenticate,
  checkPermission(Resource.LEADS, Action.UPDATE),
  geocodeLead
);

export default router; 