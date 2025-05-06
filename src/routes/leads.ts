import { Router } from 'express';
import { 
  createLead, 
  getLeads, 
  getLeadById, 
  updateLead, 
  deleteLead,
  assignLead,
  getLeadsByUser
} from '../controllers/leads.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';
import { validateLead } from '../middleware/leads.middleware';
import multer from 'multer';
import { importLeadsFromCSV } from '../controllers/import-csv.controller';

const router = Router();

// Configuración de multer para archivos CSV
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV'));
    }
  }
});

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas para todos los roles
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.get('/user/:userId', getLeadsByUser);

// Rutas solo para managers y admin
router.post('/', authorizeRole(['manager', 'admin']), validateLead, createLead);
router.put('/:id', authorizeRole(['manager', 'admin']), validateLead, updateLead);
router.delete('/:id', authorizeRole(['admin']), deleteLead);
router.post('/:id/assign', authorizeRole(['manager', 'admin']), assignLead);

// Importar leads desde CSV (solo managers y admin)
router.post('/import-csv', authorizeRole(['manager', 'admin']), upload.single('file'), importLeadsFromCSV);

export default router; 