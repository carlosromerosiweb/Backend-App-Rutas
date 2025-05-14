import { Router } from 'express';
import { RouteController } from '../controllers/route.controller';
import { createRouteSchema, updateRouteSchema, assignUserSchema, assignLeadsSchema } from '../types/route.types';
import { validateRequest } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const routeController = new RouteController();

// Crear una nueva ruta
router.post(
  '/',
  authMiddleware,
  validateRequest({ body: createRouteSchema }),
  routeController.createRoute
);

// Obtener rutas de un equipo
router.get(
  '/team/:team_id',
  authMiddleware,
  routeController.getRoutesByTeam
);

// Actualizar una ruta
router.put(
  '/:route_id',
  authMiddleware,
  validateRequest({ body: updateRouteSchema }),
  routeController.updateRoute
);

// Eliminar una ruta
router.delete(
  '/:route_id',
  authMiddleware,
  routeController.deleteRoute
);

// Asignar usuario a una ruta
router.post(
  '/:route_id/assign-user',
  authMiddleware,
  validateRequest({ body: assignUserSchema }),
  routeController.assignUser
);

// Asignar leads a una ruta
router.post(
  '/:route_id/assign-leads',
  authMiddleware,
  validateRequest({ body: assignLeadsSchema }),
  routeController.assignLeads
);

// Obtener leads de una ruta
router.get(
  '/:route_id/leads',
  authMiddleware,
  routeController.getRouteLeads
);

// Obtener usuarios de una ruta
router.get(
  '/:route_id/users',
  authMiddleware,
  routeController.getRouteUsers
);

export default router; 