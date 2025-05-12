/**
 * Rutas para importación de datos
 */
import express from 'express';
import { upload, importLeadsFromCsv } from '../controllers/import';
import { authenticate } from '../middlewares/auth';
import { Resource, Action } from '../config/permissions';
import { checkPermission } from '../middlewares/auth';

const router = express.Router();

/**
 * @route POST /api/import/leads
 * @desc Importa leads desde un archivo CSV
 * @access Privado (requiere autenticación y permisos de admin o manager)
 */
router.post('/leads', 
  authenticate,
  checkPermission(Resource.LEADS, Action.CREATE),
  upload.single('file'), // 'file' es el nombre del campo en el formulario
  importLeadsFromCsv
);

export default router;