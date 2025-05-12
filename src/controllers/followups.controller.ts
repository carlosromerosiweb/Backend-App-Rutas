import { Request, Response } from 'express';
import { leadService } from '../services/lead.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

/**
 * Establece o actualiza la fecha de seguimiento de un lead
 */
export const setFollowUp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const leadId = parseInt(req.params.id);
    const { follow_up_at } = req.body;

    if (isNaN(leadId)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'El ID del lead debe ser un número válido'
      });
      return;
    }

    if (!follow_up_at) {
      res.status(400).json({
        error: 'Datos incompletos',
        message: 'La fecha de seguimiento es obligatoria'
      });
      return;
    }

    // Validar formato de fecha
    const followUpDate = new Date(follow_up_at);
    if (isNaN(followUpDate.getTime())) {
      res.status(400).json({
        error: 'Fecha inválida',
        message: 'El formato de fecha no es válido'
      });
      return;
    }

    // Obtener lead para verificar permisos
    const lead = await leadService.getLeadById(leadId);
    
    if (!lead) {
      res.status(404).json({
        error: 'Lead no encontrado',
        message: `No se encontró un lead con el ID ${leadId}`
      });
      return;
    }

    // Verificar permisos: un comercial solo puede actualizar sus leads asignados
    if (
      req.user && 
      req.user.role === 'comercial' && 
      lead.assigned_to && 
      lead.assigned_to.toString() !== req.user.userId
    ) {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para actualizar este lead'
      });
      return;
    }

    // Actualizar la fecha de seguimiento
    const updatedLead = await leadService.updateLead(leadId, { next_followup: followUpDate });

    if (updatedLead) {
      res.status(200).json({
        message: 'Fecha de seguimiento actualizada correctamente',
        lead: updatedLead
      });
    } else {
      res.status(500).json({
        error: 'Error al actualizar fecha de seguimiento',
        message: 'Ocurrió un error al actualizar la fecha de seguimiento'
      });
    }
  } catch (error) {
    logger.error('Error al actualizar fecha de seguimiento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
};

/**
 * Obtiene los leads con seguimientos programados para hoy
 */
export const getTodayFollowUps = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.user!.userId);
    const userRole = req.user!.role;

    // Calcular el rango de fechas (hoy hasta 1 hora después)
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Obtener leads con seguimientos programados
    const result = await leadService.getLeads({
      next_followup_after: now,
      next_followup_before: oneHourLater,
      assigned_to: userRole === 'comercial' ? userId : undefined
    });

    res.status(200).json({
      message: 'Seguimientos programados obtenidos correctamente',
      followups: result.leads
    });
  } catch (error) {
    logger.error('Error al obtener seguimientos programados:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
}; 