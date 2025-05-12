import { Router } from 'express';
import { OfflineSyncController } from '../controllers/offline-sync.controller';
import { authenticate } from '../middlewares/auth';
import { validateRole } from '../middlewares/role-validation';

const router = Router();
const controller = new OfflineSyncController();

// Ruta para sincronización offline
router.post(
  '/sync/offline-data',
  authenticate,
  validateRole(['comercial', 'manager', 'admin']),
  controller.syncOfflineData.bind(controller)
);

export default router; 