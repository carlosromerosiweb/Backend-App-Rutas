/**
 * Rutas para la gestión de reportes
 */
import { Router } from 'express';
import { authenticate, checkPermission } from '../middlewares/auth';
import { Resource, Action } from '../config/permissions';
import { getPerformanceSummary } from '../controllers/reports.controller';

const router = Router();

/**
 * @route GET /api/reports/summary
 * @desc Obtiene un resumen de rendimiento para un usuario o todos los usuarios
 * @access Privado (requiere autenticación y rol manager/admin para ver todos)
 */
router.get(
  '/summary',
  authenticate,
  checkPermission(Resource.REPORTS, Action.VIEW_ALL),
  getPerformanceSummary
);

export default router; 