import { Router } from 'express';
import { RouteOptimizationController } from '../controllers/routeOptimizationController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();
const routeOptimizationController = new RouteOptimizationController();

router.get(
  '/optimized',
  authenticateJWT,
  routeOptimizationController.getOptimizedRoute
);

export default router; 