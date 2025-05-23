import { Request, Response } from 'express';
import { managerDashboardService } from '../services/manager-dashboard.service';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';

// Esquemas de validación
const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const exportFiltersSchema = z.object({
  status: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});

export class ManagerDashboardController {
  /**
   * Obtiene la vista general del dashboard para el manager
   */
  public async getManagerOverview(req: Request, res: Response): Promise<void> {
    try {
      const managerId = parseInt(req.user?.id as string);
      const dateRange = req.query.startDate && req.query.endDate
        ? dateRangeSchema.parse({
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
          })
        : undefined;

      const [teamOverview, teamRanking, leadsStatus, delayedCheckins] = await Promise.all([
        managerDashboardService.getTeamOverview(managerId, dateRange),
        managerDashboardService.getTeamRanking(managerId, dateRange),
        managerDashboardService.getLeadsStatus(managerId),
        managerDashboardService.getDelayedCheckins(managerId, dateRange),
      ]);

      // Registrar acceso al dashboard
      logger.info('Acceso al dashboard del manager', {
        managerId,
        dateRange,
        timestamp: new Date().toISOString(),
      });

      res.json({
        teamOverview,
        teamRanking,
        leadsStatus,
        delayedCheckins,
      });
    } catch (error) {
      logger.error('Error en getManagerOverview:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  }

  /**
   * Exporta los datos del equipo a CSV
   */
  public async exportTeamData(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.user?.id as string);
      const userRole = req.user?.role?.toLowerCase();

      // Establecer fechas por defecto si no se proporcionan
      const defaultEndDate = new Date().toISOString().split('T')[0];
      const defaultStartDate = new Date();
      defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
      const defaultStartDateStr = defaultStartDate.toISOString().split('T')[0];

      const dateRange = dateRangeSchema.parse({
        startDate: (req.query.startDate as string) || defaultStartDateStr,
        endDate: (req.query.endDate as string) || defaultEndDate,
      });
      const filters = exportFiltersSchema.parse(req.query);

      // Si es admin, no necesitamos un managerId específico
      const data = await managerDashboardService.exportTeamData(
        userRole === 'admin' ? null : userId,
        dateRange,
        filters
      );

      // Formatear las fechas en los datos
      const formattedData = data.map(lead => ({
        ...lead,
        created_at: new Date(lead.created_at).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(',', ''),
        next_followup: lead.next_followup ? new Date(lead.next_followup).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(',', '') : 'No programado',
        estimated_value: lead.estimated_value ? `${lead.estimated_value}€` : 'No especificado',
        assigned_to: lead.assigned_to || 'No asignado',
        team_name: lead.team_name || 'No asignado',
        total_checkins: lead.total_checkins || '0',
        delayed_checkins: lead.delayed_checkins || '0'
      }));

      // Crear directorio de exportaciones si no existe
      const exportDir = path.join(__dirname, '../../exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      // Generar nombre de archivo único
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `team_export_${userRole === 'admin' ? 'all' : userId}_${timestamp}.csv`;
      const filepath = path.join(exportDir, filename);

      // Configurar escritor CSV
      const csvWriter = createObjectCsvWriter({
        path: filepath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'lead_name', title: 'Nombre del Lead' },
          { id: 'status', title: 'Estado' },
          { id: 'priority', title: 'Prioridad' },
          { id: 'type', title: 'Tipo' },
          { id: 'created_at', title: 'Fecha de Creación' },
          { id: 'next_followup', title: 'Próximo Seguimiento' },
          { id: 'estimated_value', title: 'Valor Estimado' },
          { id: 'assigned_to', title: 'Asignado a' },
          { id: 'team_name', title: 'Equipo' },
          { id: 'total_checkins', title: 'Total Check-ins' },
          { id: 'delayed_checkins', title: 'Check-ins Retrasados' },
        ],
      });

      // Escribir datos al CSV
      await csvWriter.writeRecords(formattedData);

      // Registrar exportación
      logger.info('Exportación de datos del equipo', {
        userId,
        userRole,
        dateRange,
        filters,
        filename,
        timestamp: new Date().toISOString(),
      });

      // Enviar archivo
      res.download(filepath, filename, (err) => {
        if (err) {
          logger.error('Error al enviar archivo:', err);
        }
        // Eliminar archivo después de enviarlo
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) {
            logger.error('Error al eliminar archivo temporal:', unlinkErr);
          }
        });
      });
    } catch (error) {
      logger.error('Error en exportTeamData:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  }
}

export const managerDashboardController = new ManagerDashboardController(); 