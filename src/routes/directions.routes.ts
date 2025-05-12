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

export default router; 