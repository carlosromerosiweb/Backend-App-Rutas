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
      SELECT DISTINCT ON (l.id) 
        l.id, 
        l.name, 
        l.address, 
        (l.coordinates->>'latitude')::float as latitude, 
        (l.coordinates->>'longitude')::float as longitude, 
        l.status, 
        l.assigned_to, 
        l.created_at
      FROM leads l
      WHERE l.status NOT IN ('ganado', 'perdido')
        AND l.coordinates IS NOT NULL
        AND l.coordinates->>'latitude' IS NOT NULL
        AND l.coordinates->>'longitude' IS NOT NULL
        AND l.assigned_to = $1
    `;

    const params: any[] = [userId];
    
    if (date) {
      query += ` AND DATE(l.created_at) = $2`;
      params.push(date);
    }

    // Ordenar por fecha de creación para mantener consistencia
    query += ` ORDER BY l.id, l.created_at DESC`;

    const result = await pool.query(query, params);
    console.log('Leads obtenidos de la base de datos:', result.rows.map(lead => ({
      id: lead.id,
      name: lead.name,
      status: lead.status,
      coordinates: { lat: lead.latitude, lng: lead.longitude }
    })));
    return result.rows;
  }

  private async getGoogleDirections(
    leads: Lead[],
    origin: { latitude: number; longitude: number },
    mode: 'driving' | 'walking' = 'driving'
  ): Promise<GoogleDirectionsResponse> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('API Key de Google Maps no configurada');
    }

    const waypoints = leads.map(lead => 
      `${lead.latitude},${lead.longitude}`
    ).join('|');

    console.log('Waypoints enviados a Google:', waypoints);

    const params = new URLSearchParams({
      origin: `${origin.latitude},${origin.longitude}`,
      destination: `${origin.latitude},${origin.longitude}`,
      waypoints: `optimize:true|${waypoints}`,
      mode: mode,
      key: apiKey
    });

    try {
      const response = await axios.get(`${this.GOOGLE_MAPS_API_URL}?${params}`);
      
      if (response.data.status !== 'OK') {
        console.error('Error en respuesta de Google:', response.data);
        throw new Error(`Error de Google Directions API: ${response.data.status}`);
      }

      console.log('Respuesta de Google:', {
        status: response.data.status,
        waypointOrder: response.data.routes[0]?.waypoint_order,
        legs: response.data.routes[0]?.legs?.length
      });

      return response.data;
    } catch (error) {
      console.error('Error al llamar a Google Directions API:', error);
      throw new Error('Error al obtener direcciones optimizadas');
    }
  }

  private async getOptimizedRouteForGroup(
    leads: Lead[],
    origin: { latitude: number; longitude: number },
    mode: 'driving' | 'walking' = 'driving'
  ): Promise<{
    steps: RouteStep[];
    totalDistance: number;
    totalDuration: number;
  }> {
    console.log('Procesando grupo de leads:', leads.map(lead => ({
      id: lead.id,
      name: lead.name
    })));

    const googleResponse = await this.getGoogleDirections(leads, origin, mode);
    const route = googleResponse.routes[0];
    const waypointOrder = route.waypoint_order || [];
    
    console.log('Orden de waypoints devuelto por Google:', waypointOrder);
    
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

    console.log('Pasos generados:', steps.map(step => ({
      order: step.order,
      lead_id: step.lead_id,
      lead_name: step.lead_name
    })));

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

  async getTeamOptimizedRoutes(
    teamId: number,
    date?: string
  ): Promise<{ [userId: string]: DirectionsResponse }> {
    try {
      // Obtener todos los usuarios del equipo
      const teamMembersQuery = `
        SELECT u.id, u.role
        FROM users u
        WHERE u.team_id = $1
      `;
      const teamMembersResult = await pool.query(teamMembersQuery, [teamId]);
      const teamMembers = teamMembersResult.rows;

      if (teamMembers.length === 0) {
        throw new Error('No hay usuarios en este equipo');
      }

      // Obtener las rutas optimizadas para cada usuario
      const teamRoutes: { [userId: string]: DirectionsResponse } = {};
      
      for (const member of teamMembers) {
        try {
          // Usar el mismo método que getOptimizedRoute para cada usuario
          const leads = await this.getLeadsByUserId(member.id.toString(), member.role, date);
          
          if (leads.length === 0) {
            console.log(`No hay leads para el usuario ${member.id}`);
            continue;
          }

          const origin = { 
            latitude: leads[0].latitude, 
            longitude: leads[0].longitude 
          };

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
            userId: member.id.toString(),
            date: date || new Date().toISOString().split('T')[0],
            leadsProcessed: leads.length,
            totalDistance: response.route_summary.total_distance,
            totalDuration: response.route_summary.total_duration
          });

          teamRoutes[member.id] = response;
        } catch (error) {
          console.error(`Error al obtener ruta para usuario ${member.id}:`, error);
          // Continuamos con el siguiente usuario si hay error
          continue;
        }
      }

      return teamRoutes;
    } catch (error) {
      console.error('Error al obtener rutas del equipo:', error);
      throw error;
    }
  }

  async getWalkingOptimizedRoute(
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
      const result = await this.getOptimizedRouteForGroup(group, origin, 'walking');
      
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

  async getTeamWalkingOptimizedRoutes(
    teamId: number,
    date?: string
  ): Promise<{ [userId: string]: DirectionsResponse }> {
    try {
      // Obtener todos los usuarios del equipo
      const teamMembersQuery = `
        SELECT u.id, u.role
        FROM users u
        WHERE u.team_id = $1
      `;
      const teamMembersResult = await pool.query(teamMembersQuery, [teamId]);
      const teamMembers = teamMembersResult.rows;

      if (teamMembers.length === 0) {
        throw new Error('No hay usuarios en este equipo');
      }

      // Obtener las rutas optimizadas para cada usuario
      const teamRoutes: { [userId: string]: DirectionsResponse } = {};
      
      for (const member of teamMembers) {
        try {
          // Usar el método getWalkingOptimizedRoute para cada usuario
          const leads = await this.getLeadsByUserId(member.id.toString(), member.role, date);
          
          if (leads.length === 0) {
            console.log(`No hay leads para el usuario ${member.id}`);
            continue;
          }

          const origin = { 
            latitude: leads[0].latitude, 
            longitude: leads[0].longitude 
          };

          // Dividir los leads en grupos más pequeños
          const leadGroups = this.chunkArray(leads, this.MAX_WAYPOINTS);
          let allSteps: RouteStep[] = [];
          let totalDistance = 0;
          let totalDuration = 0;
          let currentOrder = 1;

          // Procesar cada grupo de leads
          for (const group of leadGroups) {
            const result = await this.getOptimizedRouteForGroup(group, origin, 'walking');
            
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
            userId: member.id.toString(),
            date: date || new Date().toISOString().split('T')[0],
            leadsProcessed: leads.length,
            totalDistance: response.route_summary.total_distance,
            totalDuration: response.route_summary.total_duration
          });

          teamRoutes[member.id] = response;
        } catch (error) {
          console.error(`Error al obtener ruta para usuario ${member.id}:`, error);
          // Continuamos con el siguiente usuario si hay error
          continue;
        }
      }

      return teamRoutes;
    } catch (error) {
      console.error('Error al obtener rutas del equipo:', error);
      throw error;
    }
  }
} 