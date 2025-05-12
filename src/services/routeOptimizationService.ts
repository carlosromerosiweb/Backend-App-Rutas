import pool from '../db';
import { calculateDistance } from '../utils/distanceCalculator';

interface RouteOptimizationParams {
  userId: string;
  userRole: string;
  date?: string;
  originLat?: number;
  originLng?: number;
}

interface RouteStep {
  order: number;
  lead_id: string;
  lead_name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_to_next?: number;
  duration_to_next?: number;
  city?: string;
}

interface OptimizedRoute {
  route_summary: {
    total_distance: number;
    total_duration: number;
    cities: string[];
  };
  steps: RouteStep[];
  origin: {
    latitude: number;
    longitude: number;
  };
  date: string;
}

interface CityGroup {
  city: string;
  leads: any[];
  center: {
    latitude: number;
    longitude: number;
  };
}

export class RouteOptimizationService {
  public async getOptimizedRoute(params: RouteOptimizationParams): Promise<OptimizedRoute> {
    const { userId, userRole, date = new Date().toISOString().split('T')[0], originLat, originLng } = params;

    // Construir la consulta SQL
    let query = `
      SELECT id, name, address, latitude, longitude, city
      FROM leads
      WHERE status NOT IN ('ganado', 'perdido')
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `;

    // Agregar filtro por usuario asignado si es comercial
    if (userRole.toLowerCase() === 'comercial') {
      query += ` AND assigned_to = $1`;
    }

    // Ejecutar la consulta
    const result = await pool.query(
      query,
      userRole.toLowerCase() === 'comercial' ? [userId] : []
    );

    const leadsList = result.rows;

    if (!leadsList.length) {
      throw new Error('No hay leads disponibles para optimizar la ruta');
    }

    // Agrupar leads por ciudad
    const cityGroups = this.groupLeadsByCity(leadsList);

    // Ordenar ciudades por distancia desde el origen
    const origin = {
      latitude: originLat || leadsList[0].latitude,
      longitude: originLng || leadsList[0].longitude,
    };

    const sortedCities = this.sortCitiesByDistance(cityGroups, origin);

    // Optimizar ruta dentro de cada ciudad
    const optimizedSteps: RouteStep[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (const cityGroup of sortedCities) {
      const citySteps = this.optimizeRoute(cityGroup.leads, cityGroup.center);
      
      // Agregar información de la ciudad a cada paso
      citySteps.forEach(step => {
        step.city = cityGroup.city;
      });

      optimizedSteps.push(...citySteps);

      // Calcular distancias y duraciones totales
      const cityDistance = citySteps.reduce((acc, step) => acc + (step.distance_to_next || 0), 0);
      const cityDuration = citySteps.reduce((acc, step) => acc + (step.duration_to_next || 0), 0);
      
      totalDistance += cityDistance;
      totalDuration += cityDuration;
    }

    return {
      route_summary: {
        total_distance: Number(totalDistance.toFixed(2)),
        total_duration: totalDuration,
        cities: sortedCities.map(group => group.city),
      },
      steps: optimizedSteps,
      origin,
      date,
    };
  }

  private groupLeadsByCity(leads: any[]): CityGroup[] {
    const cityMap = new Map<string, any[]>();

    // Agrupar leads por ciudad
    leads.forEach(lead => {
      const city = lead.city || 'Sin ciudad';
      if (!cityMap.has(city)) {
        cityMap.set(city, []);
      }
      cityMap.get(city)?.push(lead);
    });

    // Calcular centro de cada ciudad
    return Array.from(cityMap.entries()).map(([city, cityLeads]) => {
      const center = this.calculateCityCenter(cityLeads);
      return {
        city,
        leads: cityLeads,
        center,
      };
    });
  }

  private calculateCityCenter(leads: any[]): { latitude: number; longitude: number } {
    const sumLat = leads.reduce((acc, lead) => acc + lead.latitude, 0);
    const sumLng = leads.reduce((acc, lead) => acc + lead.longitude, 0);
    return {
      latitude: sumLat / leads.length,
      longitude: sumLng / leads.length,
    };
  }

  private sortCitiesByDistance(cityGroups: CityGroup[], origin: { latitude: number; longitude: number }): CityGroup[] {
    return cityGroups.sort((a, b) => {
      const distA = calculateDistance(
        origin.latitude,
        origin.longitude,
        a.center.latitude,
        a.center.longitude
      );
      const distB = calculateDistance(
        origin.latitude,
        origin.longitude,
        b.center.latitude,
        b.center.longitude
      );
      return distA - distB;
    });
  }

  private optimizeRoute(leads: any[], origin: { latitude: number; longitude: number }): RouteStep[] {
    // Implementación simple del algoritmo del vecino más cercano
    const unvisited = [...leads];
    const route: RouteStep[] = [];
    let currentPoint = origin;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      // Encontrar el punto más cercano
      for (let i = 0; i < unvisited.length; i++) {
        const distance = calculateDistance(
          currentPoint.latitude,
          currentPoint.longitude,
          unvisited[i].latitude,
          unvisited[i].longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      // Agregar el punto más cercano a la ruta
      const nextPoint = unvisited[nearestIndex];
      route.push({
        order: route.length + 1,
        lead_id: nextPoint.id,
        lead_name: nextPoint.name,
        address: nextPoint.address,
        latitude: nextPoint.latitude,
        longitude: nextPoint.longitude,
        distance_to_next: Number(minDistance.toFixed(2)),
        duration_to_next: Math.round(minDistance * 2), // Estimación simple: 2 minutos por km
      });

      currentPoint = nextPoint;
      unvisited.splice(nearestIndex, 1);
    }

    return route;
  }
} 