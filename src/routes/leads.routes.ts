import { Router } from 'express';
import { LeadsExportController } from '../controllers/leadsExport.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();
const leadsExportController = new LeadsExportController();

// Ruta de exportación de leads
router.get(
  '/export',
  authenticate,
  authorize(['admin', 'manager']),
  (req, res) => leadsExportController.exportLeads(req, res)
);

export default router; 