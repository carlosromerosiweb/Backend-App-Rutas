import { Router } from 'express';
import { managerDashboardController } from '../controllers/manager-dashboard.controller';
import { managerRoleMiddleware } from '../middleware/manager.middleware';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Todas las rutas requieren autenticación JWT y rol de manager
router.use(authenticate);
router.use(managerRoleMiddleware);

// Obtener vista general del dashboard
router.get('/overview', managerDashboardController.getManagerOverview.bind(managerDashboardController));

// Exportar datos del equipo
router.get('/export', managerDashboardController.exportTeamData.bind(managerDashboardController));

export default router; 