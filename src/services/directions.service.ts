import axios from 'axios';
import pool from '../db';
import { Lead, DirectionsResponse, GoogleDirectionsResponse } from '../types/directions.types';

export class DirectionsService {
  private readonly GOOGLE_MAPS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';
  private readonly ORIGIN = { lat: 40.4168, lng: -3.7038 }; // Madrid centro

  async getLeadsByUserId(userId: string): Promise<Lead[]> {
    const query = `
      SELECT 
        id, 
        assigned_to as user_id, 
        name, 
        address, 
        (coordinates->>'latitude')::float as latitude, 
        (coordinates->>'longitude')::float as longitude
      FROM leads
      WHERE assigned_to = $1
      AND coordinates IS NOT NULL
      AND (coordinates->>'latitude') IS NOT NULL
      AND (coordinates->>'longitude') IS NOT NULL
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  private async getGoogleDirections(leads: Lead[]): Promise<GoogleDirectionsResponse> {
    if (leads.length === 0) {
      throw new Error('No hay leads con coordenadas válidas');
    }

    const waypoints = leads.slice(0, -1).map(lead => 
      `${lead.latitude},${lead.longitude}`
    );
    
    const destination = `${leads[leads.length - 1].latitude},${leads[leads.length - 1].longitude}`;
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY no está definida en las variables de entorno');
    }

    // Log en color amarillo
    console.log('\x1b[33m%s\x1b[0m', '[Directions API] Llamando a Google Directions API...');
    console.log('\x1b[33m%s\x1b[0m', `[Directions API] URL: ${this.GOOGLE_MAPS_API_URL}`);
    console.log('\x1b[33m%s\x1b[0m', `[Directions API] API Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
    console.log('\x1b[33m%s\x1b[0m', `[Directions API] Origen: ${this.ORIGIN.lat},${this.ORIGIN.lng}`);
    console.log('\x1b[33m%s\x1b[0m', `[Directions API] Destino: ${destination}`);
    console.log('\x1b[33m%s\x1b[0m', `[Directions API] Waypoints: ${waypoints.length}`);

    const params = {
      origin: `${this.ORIGIN.lat},${this.ORIGIN.lng}`,
      destination,
      waypoints: waypoints.length > 0 ? `optimize:true|${waypoints.join('|')}` : undefined,
      key: apiKey,
      language: 'es'
    };

    try {
      const response = await axios.get<GoogleDirectionsResponse>(this.GOOGLE_MAPS_API_URL, { params });
      
      if (response.data.status !== 'OK') {
        const errorMessage = `Error en la API de Google: ${response.data.status} - ${response.data.error_message || 'Sin mensaje de error'}`;
        console.error('\x1b[31m%s\x1b[0m', `[Directions API] ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('\x1b[31m%s\x1b[0m', '[Directions API] Error en la petición:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw new Error(`Error en la petición a Google Directions API: ${error.message}`);
      }
      throw error;
    }
  }

  private processDirectionsResponse(
    googleResponse: GoogleDirectionsResponse,
    leads: Lead[]
  ): DirectionsResponse {
    const route = googleResponse.routes[0];
    const waypointOrder = route.waypoint_order || [];
    
    // Reordenar leads según el orden optimizado
    const orderedLeads = [leads[leads.length - 1]]; // El último lead es el destino
    waypointOrder.forEach(index => {
      orderedLeads.unshift(leads[index]);
    });

    // Calcular totales
    let totalDistance = 0;
    let totalDuration = 0;
    const allSteps: any[] = [];

    route.legs.forEach(leg => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;
      allSteps.push(...leg.steps);
    });

    return {
      ordered_leads: orderedLeads,
      total_distance_km: Math.round(totalDistance / 1000),
      total_duration_min: Math.round(totalDuration / 60),
      steps: allSteps
    };
  }

  async getOptimizedRoute(userId: string): Promise<DirectionsResponse> {
    const leads = await this.getLeadsByUserId(userId);
    
    if (leads.length === 0) {
      throw new Error('No hay leads con coordenadas válidas para este usuario');
    }

    const googleResponse = await this.getGoogleDirections(leads);
    return this.processDirectionsResponse(googleResponse, leads);
  }
} 