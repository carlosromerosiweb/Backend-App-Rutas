/**
 * Controladores para importación de datos
 */
import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { importService } from '../../services/import.service';
import { logger } from '../../utils/logger';

// Configuración de multer para almacenamiento de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Crear directorio temporal si no existe
    const tmpDir = path.join(__dirname, '../../../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    cb(null, tmpDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para evitar colisiones
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1000);
    cb(null, `${uniquePrefix}-${file.originalname}`);
  }
});

// Filtro para validar que sea un archivo CSV
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  
  if (allowedMimeTypes.includes(file.mimetype) || 
      path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos CSV'));
  }
};

// Inicializar uploader con límite de 5MB
export const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * Importa leads desde un archivo CSV
 */
export const importLeadsFromCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    // El archivo ya debería estar guardado por multer en req.file
    if (!req.file) {
      res.status(400).json({
        error: 'Archivo no proporcionado',
        message: 'No se ha proporcionado ningún archivo CSV para importar'
      });
      return;
    }

    // Obtener el ID del usuario al que asignar los leads por defecto
    const defaultAssignedTo = req.body.default_assigned_to ? 
      parseInt(req.body.default_assigned_to) : undefined;

    // Importar leads desde el CSV
    const stats = await importService.importLeadsFromCsv(
      req.file.path,
      defaultAssignedTo
    );

    // Generar mensaje de éxito
    res.status(200).json({
      message: 'Importación completada',
      stats: {
        total: stats.total,
        success: stats.success,
        failed: stats.failed
      },
      errors: stats.errors
    });
  } catch (error) {
    logger.error('Error al importar leads desde CSV:', error);
    
    res.status(500).json({
      error: 'Error al procesar la importación',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};