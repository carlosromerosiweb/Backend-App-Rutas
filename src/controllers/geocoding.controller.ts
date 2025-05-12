import { Request, Response } from 'express';
import { geocodingService } from '../services/geocoding.service';
import { leadService } from '../services/lead.service';
import { logger } from '../utils/logger';

/**
 * Geocodifica la dirección de un lead y actualiza sus coordenadas
 */
export const geocodeLead = async (req: Request, res: Response): Promise<void> => {
  try {
    const leadId = parseInt(req.params.id);
    
    if (isNaN(leadId)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'El ID del lead debe ser un número válido'
      });
      return;
    }

    // Obtener el lead
    const lead = await leadService.getLeadById(leadId);
    if (!lead) {
      res.status(404).json({
        error: 'Lead no encontrado',
        message: `No existe un lead con el ID ${leadId}`
      });
      return;
    }

    // Verificar que el lead tiene una dirección
    if (!lead.address) {
      res.status(400).json({
        error: 'Dirección no disponible',
        message: 'El lead no tiene una dirección registrada'
      });
      return;
    }

    // Construir dirección completa
    const fullAddress = [
      lead.address,
      lead.city,
      lead.postal_code,
      lead.country
    ].filter(Boolean).join(', ');

    logger.info(`Intentando geocodificar lead ${leadId}: ${fullAddress}`);

    // Geocodificar la dirección
    const coordinates = await geocodingService.geocodeAddress(fullAddress);

    // Actualizar el lead con las coordenadas
    const updatedLead = await leadService.updateLead(leadId, {
      coordinates: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      }
    });

    if (!updatedLead) {
      throw new Error('Error al actualizar las coordenadas del lead');
    }

    logger.info(`Lead ${leadId} actualizado con coordenadas: ${coordinates.latitude}, ${coordinates.longitude}`);

    res.status(200).json({
      message: 'Coordenadas actualizadas correctamente',
      lead: updatedLead
    });
  } catch (error) {
    logger.error('Error al geocodificar lead:', error);
    
    // Determinar el código de estado apropiado
    let statusCode = 500;
    let errorMessage = 'Error desconocido';

    if (error instanceof Error) {
      if (error.message.includes('REQUEST_DENIED')) {
        statusCode = 500;
        errorMessage = 'Error de configuración de la API de Google Maps';
      } else if (error.message.includes('OVER_QUERY_LIMIT')) {
        statusCode = 429;
        errorMessage = 'Se ha excedido el límite de peticiones a la API de Google Maps';
      } else if (error.message.includes('ZERO_RESULTS')) {
        statusCode = 404;
        errorMessage = 'No se encontraron coordenadas para la dirección proporcionada';
      } else if (error.message.includes('INVALID_REQUEST')) {
        statusCode = 400;
        errorMessage = 'La dirección proporcionada no es válida';
      } else {
        errorMessage = error.message;
      }
    }

    res.status(statusCode).json({
      error: 'Error al geocodificar lead',
      message: errorMessage
    });
  }
}; 