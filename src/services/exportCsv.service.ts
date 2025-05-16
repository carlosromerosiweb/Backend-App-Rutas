import { format } from 'date-fns';
import { createWriteStream, createReadStream, statSync } from 'fs';
import * as fastCsv from 'fast-csv';
import { Pool } from 'pg';
import db from '../db';
import archiver from 'archiver';
import { sanitizeCsvValue } from '../utils/csvSanitizer';
import { logger } from '../utils/logger';

interface ExportLeadsParams {
  status?: string;
  from?: string;
  to?: string;
  filename?: string;
  compress?: boolean;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: string;
  priority: string;
  created_at: Date;
  last_contact?: Date;
  next_followup?: Date;
  category?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  assigned_to?: number;
}

export class ExportCsvService {
  private pool: Pool;
  private readonly BATCH_SIZE = 1000;

  constructor() {
    this.pool = db;
  }

  private formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  }

  private async processBatch(leads: Lead[], csvStream: fastCsv.CsvFormatterStream<any, any>): Promise<void> {
    for (const lead of leads) {
      const sanitizedLead = {
        ID: lead.id,
        Nombre: sanitizeCsvValue(lead.name),
        Email: sanitizeCsvValue(lead.email),
        Teléfono: sanitizeCsvValue(lead.phone),
        Dirección: sanitizeCsvValue(lead.address),
        Ciudad: sanitizeCsvValue(lead.city),
        Estado: sanitizeCsvValue(lead.status),
        Prioridad: sanitizeCsvValue(lead.priority),
        'Fecha creación': this.formatDate(lead.created_at),
        'Último contacto': lead.last_contact ? this.formatDate(lead.last_contact) : '',
        'Próximo seguimiento': lead.next_followup ? this.formatDate(lead.next_followup) : '',
        Categoría: sanitizeCsvValue(lead.category || ''),
        Calificación: lead.rating || '',
        Latitud: lead.latitude || '',
        Longitud: lead.longitude || '',
        'Asignado a': lead.assigned_to || ''
      };
      csvStream.write(sanitizedLead);
    }
  }

  async exportLeadsToCsv(params: ExportLeadsParams): Promise<{ filePath: string; stats: any }> {
    const startTime = Date.now();
    const { status, from, to, filename, compress } = params;
    logger.info('Iniciando exportación de leads con parámetros:', params);

    // Construir la consulta SQL base
    let query = `
      SELECT 
        id, name, email, phone, address, city, status, priority, 
        created_at, last_contact, next_followup, category, rating,
        latitude, longitude, assigned_to
      FROM leads
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (status) {
      query += ' AND status = $1';
      queryParams.push(status);
    }

    if (from) {
      query += ` AND created_at >= $${queryParams.length + 1}`;
      queryParams.push(from);
    }

    if (to) {
      query += ` AND created_at <= $${queryParams.length + 1}`;
      queryParams.push(to);
    }

    query += ' ORDER BY created_at DESC';

    // Generar nombre de archivo
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const baseFilename = filename || `leads_export_${timestamp}`;
    const csvFilePath = `./temp/${baseFilename}.csv`;
    const zipFilePath = `./temp/${baseFilename}.zip`;

    // Crear stream de escritura CSV
    const csvStream = fastCsv.format({ headers: true });
    const writeStream = createWriteStream(csvFilePath);

    // Añadir BOM para Excel
    writeStream.write('\uFEFF');

    // Escribir headers
    csvStream.write({
      ID: 'ID',
      Nombre: 'Nombre',
      Email: 'Email',
      Teléfono: 'Teléfono',
      Dirección: 'Dirección',
      Ciudad: 'Ciudad',
      Estado: 'Estado',
      Prioridad: 'Prioridad',
      'Fecha creación': 'Fecha creación',
      'Último contacto': 'Último contacto',
      'Próximo seguimiento': 'Próximo seguimiento',
      Categoría: 'Categoría',
      Calificación: 'Calificación',
      Latitud: 'Latitud',
      Longitud: 'Longitud',
      'Asignado a': 'Asignado a'
    });

    try {
      // Obtener total de registros
      const countResult = await this.pool.query(
        `SELECT COUNT(*) FROM (${query}) as count_query`,
        queryParams
      );
      const totalRecords = parseInt(countResult.rows[0].count);
      logger.info(`Total de registros a exportar: ${totalRecords}`);

      // Procesar en lotes
      let processedRecords = 0;
      while (processedRecords < totalRecords) {
        const batchQuery = `${query} LIMIT ${this.BATCH_SIZE} OFFSET ${processedRecords}`;
        const batchResult = await this.pool.query(batchQuery, queryParams);
        await this.processBatch(batchResult.rows, csvStream);
        processedRecords += batchResult.rows.length;
        logger.info(`Procesados ${processedRecords} de ${totalRecords} registros`);
      }

      // Finalizar escritura CSV
      csvStream.pipe(writeStream);
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
        csvStream.end();
      });

      const stats = {
        totalRecords,
        processingTime: Date.now() - startTime,
        fileSize: statSync(csvFilePath).size
      };

      // Comprimir si se solicita
      if (compress) {
        await this.compressFile(csvFilePath, zipFilePath);
        return { filePath: zipFilePath, stats };
      }

      return { filePath: csvFilePath, stats };
    } catch (error) {
      logger.error('Error en exportación de leads:', error);
      throw new Error(`Error al exportar leads: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async compressFile(sourcePath: string, targetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(targetPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        logger.info(`Archivo comprimido creado: ${targetPath}`);
        resolve();
      });

      archive.on('error', (err) => {
        logger.error('Error al comprimir archivo:', err);
        reject(err);
      });

      archive.pipe(output);
      archive.file(sourcePath, { name: 'leads.csv' });
      archive.finalize();
    });
  }
} 