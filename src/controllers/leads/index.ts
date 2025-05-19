/**
 * Controladores para la gestión de leads/clientes potenciales
 */
import { Request, Response } from 'express';
import { leadService } from '../../services/lead.service';
import { logger, logAction } from '../../utils/logger';
import { 
  CreateLeadDto, 
  UpdateLeadDto, 
  LeadStatus, 
  LeadPriority,
  LeadType,
  CreateLeadInteractionDto
} from '../../types/leads';

/**
 * Crea un nuevo lead
 */
export const createLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadDto: CreateLeadDto = req.body;
    
    // Validar datos mínimos requeridos
    if (!leadDto.name || !leadDto.type) {
      res.status(400).json({
        error: 'Datos incompletos',
        message: 'El nombre y tipo de lead son obligatorios'
      });
      return;
    }
    
    // Validar que el tipo de lead sea válido
    const validLeadTypes = Object.values(LeadType);
    if (!validLeadTypes.includes(leadDto.type as LeadType)) {
      res.status(400).json({
        error: 'Tipo de lead inválido',
        message: `El tipo debe ser uno de los siguientes: ${validLeadTypes.join(', ')}`
      });
      return;
    }
    
    // Si se especifica un estado, validarlo
    if (leadDto.status) {
      const validStatuses = Object.values(LeadStatus);
      if (!validStatuses.includes(leadDto.status as LeadStatus)) {
        res.status(400).json({
          error: 'Estado de lead inválido',
          message: `El estado debe ser uno de los siguientes: ${validStatuses.join(', ')}`
        });
        return;
      }
    }
    
    // Si se especifica una prioridad, validarla
    if (leadDto.priority) {
      const validPriorities = Object.values(LeadPriority);
      if (!validPriorities.includes(leadDto.priority as LeadPriority)) {
        res.status(400).json({
          error: 'Prioridad de lead inválida',
          message: `La prioridad debe ser una de las siguientes: ${validPriorities.join(', ')}`
        });
        return;
      }
    }
    
    // Asignar al usuario actual si no se especifica otro y el usuario es comercial
    if (!leadDto.assigned_to && req.user && req.user.role === 'comercial') {
      leadDto.assigned_to = parseInt(req.user.userId);
    }
    
    const lead = await leadService.createLead(leadDto);
    
    if (lead) {
      // Registrar el log de creación exitosa
      await logAction({
        action: 'create',
        entity: 'lead',
        entityId: lead.id.toString(),
        message: `Lead creado: ${lead.name}`,
        status: 'success',
        metadata: {
          leadType: lead.type,
          status: lead.status,
          priority: lead.priority,
          assignedTo: lead.assigned_to
        },
        req
      });

      res.status(201).json({
        message: 'Lead creado correctamente',
        lead
      });
    } else {
      // Registrar el log de error
      await logAction({
        action: 'create',
        entity: 'lead',
        message: 'Error al crear lead',
        status: 'error',
        metadata: {
          leadData: leadDto
        },
        req
      });

      res.status(500).json({
        error: 'Error al crear lead',
        message: 'Ocurrió un error al crear el lead'
      });
    }
  } catch (error) {
    // Registrar el log de error
    await logAction({
      action: 'create',
      entity: 'lead',
      message: 'Error al crear lead',
      status: 'error',
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      },
      req
    });

    logger.error('Error al crear lead:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
};

/**
 * Obtiene la lista de leads con filtros opcionales
 */
export const getLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parámetros de paginación
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Aplicar filtros basados en parámetros de consulta
    const filters: any = {};
    
    // Filtros básicos
    if (req.query.id) filters.id = parseInt(req.query.id as string);
    if (req.query.name) filters.name = req.query.name as string;
    if (req.query.email) filters.email = req.query.email as string;
    if (req.query.phone) filters.phone = req.query.phone as string;
    if (req.query.address) filters.address = req.query.address as string;
    if (req.query.city) filters.city = req.query.city as string;
    if (req.query.postal_code) filters.postal_code = req.query.postal_code as string;
    if (req.query.country) filters.country = req.query.country as string;
    if (req.query.type) filters.type = req.query.type as string;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.priority) filters.priority = req.query.priority as string;
    if (req.query.assigned_to) filters.assigned_to = parseInt(req.query.assigned_to as string);
    if (req.query.notes) filters.notes = req.query.notes as string;
    if (req.query.estimated_value) filters.estimated_value = parseFloat(req.query.estimated_value as string);
    if (req.query.place_id) filters.place_id = req.query.place_id as string;
    if (req.query.rating) filters.rating = parseFloat(req.query.rating as string);
    if (req.query.category) filters.category = req.query.category as string;
    
    // Filtros de búsqueda general
    if (req.query.search) filters.search = req.query.search as string;
    
    // Filtros de fechas
    if (req.query.created_after) filters.created_after = new Date(req.query.created_after as string);
    if (req.query.created_before) filters.created_before = new Date(req.query.created_before as string);
    if (req.query.updated_after) filters.updated_after = new Date(req.query.updated_after as string);
    if (req.query.updated_before) filters.updated_before = new Date(req.query.updated_before as string);
    if (req.query.last_contact_after) filters.last_contact_after = new Date(req.query.last_contact_after as string);
    if (req.query.last_contact_before) filters.last_contact_before = new Date(req.query.last_contact_before as string);
    if (req.query.next_followup_after) filters.next_followup_after = new Date(req.query.next_followup_after as string);
    if (req.query.next_followup_before) filters.next_followup_before = new Date(req.query.next_followup_before as string);
    
    // Filtros de coordenadas
    if (req.query.latitude) filters.latitude = parseFloat(req.query.latitude as string);
    if (req.query.longitude) filters.longitude = parseFloat(req.query.longitude as string);
    
    // Si el usuario tiene rol 'comercial', solo mostrar sus leads asignados
    if (req.user && req.user.role === 'comercial') {
      filters.assigned_to = parseInt(req.user.userId);
    }
    
    // Obtener leads con filtros
    const result = await leadService.getLeads(filters, page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error al obtener leads:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
};

/**
 * Obtiene un lead por su ID
 */
export const getLeadById = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = parseInt(req.params.id);
    
    if (isNaN(leadId)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'El ID del lead debe ser un número válido'
      });
      return;
    }
    
    const lead = await leadService.getLeadById(leadId);
    
    if (!lead) {
      res.status(404).json({
        error: 'Lead no encontrado',
        message: `No se encontró un lead con el ID ${leadId}`
      });
      return;
    }
    
    // Verificar acceso: si es comercial, solo puede ver sus leads asignados
    if (
      req.user && 
      req.user.role === 'comercial' && 
      lead.assigned_to && 
      lead.assigned_to.toString() !== req.user.userId
    ) {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para ver este lead'
      });
      return;
    }
    
    res.status(200).json(lead);
  } catch (error) {
    logger.error(`Error al obtener lead:`, error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
};

/**
 * Actualiza un lead existente
 */
export const updateLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = parseInt(req.params.id);
    const leadDto: UpdateLeadDto = req.body;
    
    if (isNaN(leadId)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'El ID del lead debe ser un número válido'
      });
      return;
    }
    
    // Obtener lead actual para verificar permisos
    const currentLead = await leadService.getLeadById(leadId);
    
    if (!currentLead) {
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
      currentLead.assigned_to && 
      currentLead.assigned_to.toString() !== req.user.userId
    ) {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para actualizar este lead'
      });
      return;
    }
    
    // Validar tipo de lead si se proporciona
    if (leadDto.type) {
      const validLeadTypes = Object.values(LeadType);
      if (!validLeadTypes.includes(leadDto.type as LeadType)) {
        res.status(400).json({
          error: 'Tipo de lead inválido',
          message: `El tipo debe ser uno de los siguientes: ${validLeadTypes.join(', ')}`
        });
        return;
      }
    }
    
    // Validar estado si se proporciona
    if (leadDto.status) {
      const validStatuses = Object.values(LeadStatus);
      if (!validStatuses.includes(leadDto.status as LeadStatus)) {
        res.status(400).json({
          error: 'Estado de lead inválido',
          message: `El estado debe ser uno de los siguientes: ${validStatuses.join(', ')}`
        });
        return;
      }
    }
    
    // Validar prioridad si se proporciona
    if (leadDto.priority) {
      const validPriorities = Object.values(LeadPriority);
      if (!validPriorities.includes(leadDto.priority as LeadPriority)) {
        res.status(400).json({
          error: 'Prioridad de lead inválida',
          message: `La prioridad debe ser una de las siguientes: ${validPriorities.join(', ')}`
        });
        return;
      }
    }
    
    const updatedLead = await leadService.updateLead(leadId, leadDto);
    
    if (updatedLead) {
      res.status(200).json({
        message: 'Lead actualizado correctamente',
        lead: updatedLead
      });
    } else {
      res.status(500).json({
        error: 'Error al actualizar lead',
        message: 'Ocurrió un error al actualizar el lead'
      });
    }
  } catch (error) {
    logger.error(`Error al actualizar lead:`, error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
};

/**
 * Elimina un lead
 */
export const deleteLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = parseInt(req.params.id);
    
    if (isNaN(leadId)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'El ID del lead debe ser un número válido'
      });
      return;
    }
    
    // Obtener lead actual para verificar permisos
    const currentLead = await leadService.getLeadById(leadId);
    
    if (!currentLead) {
      res.status(404).json({
        error: 'Lead no encontrado',
        message: `No se encontró un lead con el ID ${leadId}`
      });
      return;
    }
    
    // En este caso solo manager y admin pueden eliminar
    if (req.user && req.user.role === 'comercial') {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para eliminar leads'
      });
      return;
    }
    
    const deleted = await leadService.deleteLead(leadId);
    
    if (deleted) {
      res.status(200).json({
        message: 'Lead eliminado correctamente'
      });
    } else {
      res.status(500).json({
        error: 'Error al eliminar lead',
        message: 'Ocurrió un error al eliminar el lead'
      });
    }
  } catch (error) {
    logger.error(`Error al eliminar lead:`, error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
};

/**
 * Actualiza el estado de un lead
 */
export const updateLeadStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    if (isNaN(leadId)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'El ID del lead debe ser un número válido'
      });
      return;
    }
    
    if (!status) {
      res.status(400).json({
        error: 'Datos incompletos',
        message: 'El estado es obligatorio'
      });
      return;
    }
    
    // Validar el estado
    const validStatuses = Object.values(LeadStatus);
    if (!validStatuses.includes(status as LeadStatus)) {
      res.status(400).json({
        error: 'Estado de lead inválido',
        message: `El estado debe ser uno de los siguientes: ${validStatuses.join(', ')}`
      });
      return;
    }
    
    // Obtener lead actual para verificar permisos
    const currentLead = await leadService.getLeadById(leadId);
    
    if (!currentLead) {
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
      currentLead.assigned_to && 
      currentLead.assigned_to.toString() !== req.user.userId
    ) {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para actualizar este lead'
      });
      return;
    }
    
    const userId = parseInt(req.user!.userId);
    const updatedLead = await leadService.updateLeadStatus(
      leadId, 
      status as LeadStatus, 
      notes, 
      userId
    );
    
    if (updatedLead) {
      res.status(200).json({
        message: 'Estado de lead actualizado correctamente',
        lead: updatedLead
      });
    } else {
      res.status(500).json({
        error: 'Error al actualizar estado del lead',
        message: 'Ocurrió un error al actualizar el estado del lead'
      });
    }
  } catch (error) {
    logger.error(`Error al actualizar estado del lead:`, error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
};

/**
 * Asigna un lead a un comercial
 */
export const assignLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = parseInt(req.params.id);
    const { userId, notes } = req.body;
    
    if (isNaN(leadId) || isNaN(userId)) {
      res.status(400).json({
        error: 'Datos inválidos',
        message: 'El ID del lead y el ID del usuario deben ser números válidos'
      });
      return;
    }
    
    // Solo admin y manager pueden asignar leads
    if (req.user && req.user.role === 'comercial') {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para asignar leads'
      });
      return;
    }
    
    const currentUserId = parseInt(req.user!.userId);
    const updatedLead = await leadService.assignLeadToUser(
      leadId, 
      userId, 
      notes, 
      currentUserId
    );
    
    if (updatedLead) {
      res.status(200).json({
        message: 'Lead asignado correctamente',
        lead: updatedLead
      });
    } else {
      res.status(500).json({
        error: 'Error al asignar lead',
        message: 'Ocurrió un error al asignar el lead'
      });
    }
  } catch (error) {
    logger.error(`Error al asignar lead:`, error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
};

/**
 * Crea una nueva interacción con un lead
 */
export const createLeadInteraction = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = parseInt(req.params.id);
    const interactionDto: CreateLeadInteractionDto = {
      ...req.body,
      lead_id: leadId
    };
    
    if (isNaN(leadId)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'El ID del lead debe ser un número válido'
      });
      return;
    }
    
    // Validar datos mínimos
    if (!interactionDto.type || !interactionDto.notes) {
      res.status(400).json({
        error: 'Datos incompletos',
        message: 'El tipo y las notas son obligatorios'
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
    
    // Verificar permisos: un comercial solo puede interactuar con sus leads asignados
    if (
      req.user && 
      req.user.role === 'comercial' && 
      lead.assigned_to && 
      lead.assigned_to.toString() !== req.user.userId
    ) {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para interactuar con este lead'
      });
      return;
    }
    
    const userId = parseInt(req.user!.userId);
    const interaction = await leadService.createInteraction(interactionDto, userId);
    
    if (interaction) {
      res.status(201).json({
        message: 'Interacción registrada correctamente',
        interaction
      });
    } else {
      res.status(500).json({
        error: 'Error al registrar interacción',
        message: 'Ocurrió un error al registrar la interacción'
      });
    }
  } catch (error) {
    logger.error(`Error al crear interacción con lead:`, error);
    res.status(500).json({
      error: 'Error al procesar la interacción con el lead',
      message: 'No se pudo completar la operación. Por favor, intente nuevamente o contacte al soporte técnico.'
    });
  }
};

/**
 * Obtiene las interacciones de un lead
 */
export const getLeadInteractions = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    if (isNaN(leadId)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'El ID del lead debe ser un número válido'
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
    
    // Verificar permisos: un comercial solo puede ver interacciones de sus leads asignados
    if (
      req.user && 
      req.user.role === 'comercial' && 
      lead.assigned_to && 
      lead.assigned_to.toString() !== req.user.userId
    ) {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permiso para ver interacciones de este lead'
      });
      return;
    }
    
    const result = await leadService.getLeadInteractions(leadId, limit, offset);
    
    res.status(200).json({
      interactions: result.interactions,
      pagination: {
        total: result.total,
        page,
        limit,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    logger.error(`Error al obtener interacciones del lead:`, error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado'
    });
  }
};