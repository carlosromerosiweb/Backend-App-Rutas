import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const UPLOAD_DIR = 'uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Asegurar que el directorio de uploads existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filtro de archivos
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten JPG, PNG y PDF.'));
  }
};

// Configuración de multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

export class FileService {
  /**
   * Guarda los archivos y retorna sus URLs
   */
  public static async saveFiles(files: Express.Multer.File[]): Promise<string[]> {
    try {
      if (!files || files.length === 0) {
        return [];
      }

      const fileUrls = files.map(file => {
        // En un entorno de producción, aquí se debería generar una URL pública
        // Por ahora, retornamos la ruta relativa
        return `/${UPLOAD_DIR}/${file.filename}`;
      });

      return fileUrls;
    } catch (error) {
      logger.error('Error al guardar archivos:', error);
      throw new Error('Error al procesar los archivos adjuntos');
    }
  }

  /**
   * Elimina archivos del sistema
   */
  public static async deleteFiles(fileUrls: string[]): Promise<void> {
    try {
      for (const url of fileUrls) {
        const filePath = path.join(process.cwd(), url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      logger.error('Error al eliminar archivos:', error);
      throw new Error('Error al eliminar los archivos');
    }
  }
} 