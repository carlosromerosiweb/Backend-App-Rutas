import { Router } from 'express';
import { DirectionsController } from '../controllers/directions.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();
const directionsController = new DirectionsController();

router.get(
  '/:userId',
  authenticate,
  directionsController.getOptimizedRoute
);

router.get(
  '/team/:teamId',
  authenticate,
  directionsController.getTeamOptimizedRoutes
);

router.get(
  '/walking/:userId',
  authenticate,
  directionsController.getWalkingOptimizedRoute
);

router.get(
  '/team/walking/:teamId',
  authenticate,
  directionsController.getTeamWalkingOptimizedRoutes
);

export default router; 