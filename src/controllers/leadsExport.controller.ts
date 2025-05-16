import { Request, Response } from 'express';
import { ExportCsvService } from '../services/exportCsv.service';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Esquema de validación para los parámetros de consulta
const exportQuerySchema = z.object({
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  filename: z.string().optional(),
  compress: z.string().optional().transform(val => val === 'true')
});

export class LeadsExportController {
  private exportService: ExportCsvService;

  constructor() {
    this.exportService = new ExportCsvService();
    // Asegurar que existen los directorios necesarios
    const tempDir = path.join(process.cwd(), 'temp');
    const logsDir = path.join(process.cwd(), 'logs');
    [tempDir, logsDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  async exportLeads(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      logger.info('Iniciando exportación de leads...', {
        query: req.query,
        user: req.user
      });

      // Validar parámetros
      const validatedParams = exportQuerySchema.parse(req.query);
      const { status, from, to, filename, compress } = validatedParams;

      // Validar fechas si se proporcionan
      if (from && !this.isValidDate(from)) {
        res.status(400).json({ 
          error: 'Fecha de inicio inválida',
          message: 'El formato de fecha debe ser YYYY-MM-DD'
        });
        return;
      }

      if (to && !this.isValidDate(to)) {
        res.status(400).json({ 
          error: 'Fecha de fin inválida',
          message: 'El formato de fecha debe ser YYYY-MM-DD'
        });
        return;
      }

      // Exportar a CSV
      const { filePath, stats } = await this.exportService.exportLeadsToCsv({
        status,
        from,
        to,
        filename,
        compress
      });

      logger.info('Exportación completada', {
        filePath,
        stats,
        processingTime: Date.now() - startTime
      });

      // Configurar headers de respuesta
      const contentType = compress ? 'application/zip' : 'text/csv';
      const contentDisposition = `attachment; filename=${path.basename(filePath)}`;
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', contentDisposition);
      res.setHeader('Content-Length', stats.fileSize);
      res.setHeader('X-Export-Generation-Time', `${stats.processingTime}ms`);
      res.setHeader('X-Total-Records', stats.totalRecords);

      // Enviar el archivo
      res.download(filePath, path.basename(filePath), (err) => {
        if (err) {
          logger.error('Error al enviar el archivo:', err);
        }
        // Limpiar el archivo temporal
        try {
          unlinkSync(filePath);
          logger.info('Archivo temporal eliminado correctamente');
        } catch (error) {
          logger.error('Error al eliminar archivo temporal:', error);
        }
      });

    } catch (error) {
      logger.error('Error en exportLeads:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Parámetros de consulta inválidos',
          message: 'Los parámetros proporcionados no son válidos',
          details: error.errors
        });
        return;
      }

      res.status(500).json({
        error: 'Error al exportar leads',
        message: 'Ocurrió un error al procesar la exportación',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
} 