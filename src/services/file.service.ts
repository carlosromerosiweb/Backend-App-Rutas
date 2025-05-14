import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import sharp from 'sharp';

const UPLOAD_DIR = 'uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

// Función para comprimir imágenes
export const compressImage = async (filePath: string): Promise<string> => {
  const ext = path.extname(filePath).toLowerCase();
  
  // Solo comprimir imágenes
  if (ext === '.pdf') {
    return filePath;
  }

  try {
    const compressedPath = filePath.replace(ext, `_compressed${ext}`);
    await sharp(filePath)
      .jpeg({ quality: 80 }) // Comprimir a calidad 80%
      .toFile(compressedPath);
    
    // Eliminar archivo original
    fs.unlinkSync(filePath);
    
    return compressedPath;
  } catch (error) {
    logger.error('Error al comprimir imagen:', error);
    return filePath; // Si falla la compresión, devolver el original
  }
};

// Función para guardar archivos
export const saveFiles = async (files: Express.Multer.File[]): Promise<string[]> => {
  const savedPaths: string[] = [];
  
  for (const file of files) {
    try {
      const filePath = path.join(UPLOAD_DIR, file.filename);
      const compressedPath = await compressImage(filePath);
      savedPaths.push(`/${compressedPath}`);
    } catch (error) {
      logger.error('Error al guardar archivo:', error);
    }
  }
  
  return savedPaths;
};

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