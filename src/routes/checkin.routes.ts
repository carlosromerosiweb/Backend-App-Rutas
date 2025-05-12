import { Router } from 'express';
import { autoCheckIn } from '../controllers/checkin.controller';
import { authenticate } from '../middlewares/auth';
import { upload } from '../services/file.service';

const router = Router();

// Ruta para check-in automático con soporte para archivos
router.post('/auto', authenticate, upload.array('files', 5), autoCheckIn);

export default router; 