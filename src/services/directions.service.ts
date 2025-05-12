import axios from 'axios';
import pool from '../db';
import { SystemLogService } from './systemLog.service';

interface Lead {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  assigned_to?: string;
}

interface GoogleDirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      steps: Array<any>;
    }>;
    waypoint_order: number[];
  }>;
  status: string;
}

interface RouteStep {
  order: number;
  lead_id: string;
  lead_name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_to_next: number;
  duration_to_next: number;
}

interface DirectionsResponse {
  route_summary: {
    total_distance: number;
    total_duration: number;
  };
  steps: RouteStep[];
  origin: {
    latitude: number;
    longitude: number;
  };
  date: string;
}

export class DirectionsService {
  private readonly GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';
  private readonly systemLogService: SystemLogService;
  private readonly MAX_WAYPOINTS = 23; // 23 waypoints + origen y destino = 25 puntos totales

  constructor() {
    this.systemLogService = new SystemLogService();
  }

  private async getLeadsByUserId(userId: string, userRole: string, date?: string): Promise<Lead[]> {
    let query = `
      SELECT id, name, address, latitude, longitude, status, assigned_to
      FROM leads
      WHERE status NOT IN ('ganado', 'perdido')
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `;

    const params: any[] = [];
    
    if (userRole.toLowerCase() === 'comercial') {
      query += ` AND assigned_to = $1`;
      params.push(userId);
    }

    if (date) {
      query += ` AND DATE(created_at) = $${params.length + 1}`;
      params.push(date);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  private async getGoogleDirections(
    leads: Lead[],
    origin: { latitude: number; longitude: number }
  ): Promise<GoogleDirectionsResponse> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('API Key de Google Maps no configurada');
    }

    const waypoints = leads.map(lead => 
      `${lead.latitude},${lead.longitude}`
    ).join('|');

    const params = new URLSearchParams({
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${origin.latitude},${origin.longitude}`,
      waypoints: `optimize:true|${waypoints}`,
      key: apiKey
    });

    try {
      const response = await axios.get(`${this.GOOGLE_MAPS_API_URL}?${params}`);
      
      if (response.data.status !== 'OK') {
        throw new Error(`Error de Google Directions API: ${response.data.status}`);
      }

      return response.data;
    } catch (error) {
      console.error('Error al llamar a Google Directions API:', error);
      throw new Error('Error al obtener direcciones optimizadas');
    }
  }

  private async getOptimizedRouteForGroup(
    leads: Lead[],
    origin: { latitude: number; longitude: number }
  ): Promise<{
    steps: RouteStep[];
    totalDistance: number;
    totalDuration: number;
  }> {
    const googleResponse = await this.getGoogleDirections(leads, origin);
    const route = googleResponse.routes[0];
    const waypointOrder = route.waypoint_order || [];
    
    const orderedLeads = waypointOrder.map(index => leads[index]);
    let totalDistance = 0;
    let totalDuration = 0;
    const steps: RouteStep[] = [];

    route.legs.forEach((leg, index) => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;

      if (index < orderedLeads.length) {
        steps.push({
          order: index + 1,
          lead_id: orderedLeads[index].id,
          lead_name: orderedLeads[index].name,
          address: orderedLeads[index].address,
          latitude: orderedLeads[index].latitude,
          longitude: orderedLeads[index].longitude,
          distance_to_next: leg.distance.value / 1000,
          duration_to_next: Math.round(leg.duration.value / 60)
        });
      }
    });

    return { steps, totalDistance, totalDuration };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async getOptimizedRoute(
    userId: string,
    userRole: string,
    date?: string,
    originLat?: number,
    originLng?: number
  ): Promise<DirectionsResponse> {
    const leads = await this.getLeadsByUserId(userId, userRole, date);
    
    if (leads.length === 0) {
      throw new Error('No hay leads con coordenadas válidas para este usuario');
    }

    const origin = originLat && originLng 
      ? { latitude: originLat, longitude: originLng }
      : { latitude: leads[0].latitude, longitude: leads[0].longitude };

    // Dividir los leads en grupos más pequeños
    const leadGroups = this.chunkArray(leads, this.MAX_WAYPOINTS);
    let allSteps: RouteStep[] = [];
    let totalDistance = 0;
    let totalDuration = 0;
    let currentOrder = 1;

    // Procesar cada grupo de leads
    for (const group of leadGroups) {
      const result = await this.getOptimizedRouteForGroup(group, origin);
      
      // Actualizar el orden de los pasos
      result.steps.forEach(step => {
        step.order = currentOrder++;
        allSteps.push(step);
      });

      totalDistance += result.totalDistance;
      totalDuration += result.totalDuration;
    }

    const response: DirectionsResponse = {
      route_summary: {
        total_distance: Number((totalDistance / 1000).toFixed(2)),
        total_duration: Math.round(totalDuration / 60)
      },
      steps: allSteps,
      origin,
      date: date || new Date().toISOString().split('T')[0]
    };

    // Registrar en system_logs
    await this.systemLogService.logRouteOptimization({
      userId,
      date: date || new Date().toISOString().split('T')[0],
      leadsProcessed: leads.length,
      totalDistance: response.route_summary.total_distance,
      totalDuration: response.route_summary.total_duration
    });

    return response;
  }
} 