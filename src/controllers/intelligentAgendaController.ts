import { Request, Response } from 'express';
import { z } from 'zod';
import { leadService } from '../services/lead.service';
import { DirectionsService } from '../services/directions.service';
import { SystemLogService } from '../services/systemLog.service';
import { Lead } from '../types/lead.types';

const querySchema = z.object({
  date: z.string().optional(),
  origin_lat: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'origin_lat debe ser un número válido'
  }),
  origin_lng: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'origin_lng debe ser un número válido'
  }),
});

interface JwtUser {
  id: string;
  role: string;
}

export class IntelligentAgendaController {
  private directionsService: DirectionsService;
  private systemLogService: SystemLogService;

  constructor() {
    this.directionsService = new DirectionsService();
    this.systemLogService = new SystemLogService();
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  async getIntelligentAgenda(req: Request, res: Response): Promise<void> {
    try {
      // Validar parámetros de entrada
      const { date = new Date().toISOString().split('T')[0], origin_lat, origin_lng } = querySchema.parse(req.query);
      
      // Convertir la fecha de entrada a objeto Date
      const targetDate = new Date(date);
      console.log('Fecha objetivo:', targetDate.toISOString());
      
      // Obtener usuario autenticado
      const user = req.user as unknown as JwtUser;
      if (!user) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      // Validar rol
      const allowedRoles = ['comercial', 'manager', 'admin'];
      if (!allowedRoles.includes(user.role.toLowerCase())) {
        res.status(403).json({ error: 'No tiene permisos para acceder a esta funcionalidad' });
        return;
      }

      // Obtener leads según el rol
      let leads: Lead[];
      if (user.role.toLowerCase() === 'comercial') {
        const response = await leadService.getLeadsByUser(parseInt(user.id));
        leads = response.leads as Lead[];
      } else {
        const response = await leadService.getLeads();
        leads = response.leads as Lead[];
      }

      console.log('Total de leads encontrados:', leads.length);

      // Definir estados activos
      const activeStatuses = ['nuevo', 'contactado', 'interesado', 'negociacion'];
      
      // Filtrar leads activos con coordenadas válidas
      const activeLeads = leads.filter(lead => {
        const isActive = activeStatuses.includes(lead.status);
        const hasCoordinates = lead.coordinates && 
                             typeof lead.coordinates === 'object' && 
                             'latitude' in lead.coordinates && 
                             'longitude' in lead.coordinates;
        
        if (!isActive) {
          console.log(`Lead ${lead.id} no está activo. Estado: ${lead.status}`);
        }
        if (!hasCoordinates) {
          console.log(`Lead ${lead.id} no tiene coordenadas válidas:`, lead.coordinates);
        }
        
        return isActive && hasCoordinates;
      });

      console.log('Leads activos con coordenadas:', activeLeads.length);
      console.log('Distribución por estado:', activeLeads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));

      // Filtrar leads por fecha de seguimiento
      const leadsByFollowup = activeLeads.filter(lead => {
        if (!lead.next_followup) return false;
        const followupDate = new Date(lead.next_followup);
        console.log('Comparando fechas:', {
          leadId: lead.id,
          followupDate: followupDate.toISOString(),
          targetDate: targetDate.toISOString(),
          isSameDay: this.isSameDay(followupDate, targetDate)
        });
        return this.isSameDay(followupDate, targetDate);
      });

      console.log('Leads con followup en la fecha:', leadsByFollowup.length);

      // Obtener leads sin interacciones recientes
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const leadsWithoutRecentInteractions = await Promise.all(
        activeLeads.map(async lead => {
          const interactions = await leadService.getLeadInteractions(lead.id);
          const lastInteraction = interactions.interactions[0];
          return !lastInteraction || new Date(lastInteraction.date) < thirtyDaysAgo;
        })
      );

      // Combinar todos los leads seleccionados
      const selectedLeads = [...new Set([
        ...leadsByFollowup,
        ...activeLeads.filter((lead, index) => 
          leadsWithoutRecentInteractions[index] && 
          (lead.priority === 'alta' || lead.priority === 'media')
        )
      ])];

      console.log('Leads seleccionados finales:', selectedLeads.length);

      if (selectedLeads.length === 0) {
        res.status(404).json({ 
          error: 'No hay leads disponibles para la fecha seleccionada',
          debug: {
            totalLeads: leads.length,
            activeLeads: activeLeads.length,
            leadsByFollowup: leadsByFollowup.length,
            targetDate: targetDate.toISOString()
          }
        });
        return;
      }

      // Determinar origen
      const origin = {
        lat: parseFloat(origin_lat!),
        lng: parseFloat(origin_lng!)
      };

      // Verificar que tenemos coordenadas válidas
      if (!origin.lat || !origin.lng) {
        res.status(400).json({ 
          error: 'Las coordenadas de origen son obligatorias y deben ser números válidos',
          debug: {
            origin_lat,
            origin_lng
          }
        });
        return;
      }

      // Optimizar ruta
      const optimizedRoute = await this.directionsService.getOptimizedRoute(
        user.id,
        user.role,
        date,
        origin.lat,
        origin.lng
      );

      // Registrar en system_logs
      await this.systemLogService.logRouteOptimization({
        userId: user.id,
        date,
        leadsProcessed: selectedLeads.length,
        totalDistance: optimizedRoute.route_summary.total_distance,
        totalDuration: optimizedRoute.route_summary.total_duration
      });

      res.json(optimizedRoute);

    } catch (error) {
      console.error('Error en getIntelligentAgenda:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
} 