import axios from 'axios';
import pool from '../db';
import { logger } from '../utils/logger';

interface PlaceResult {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  place_id: string;
  types: string[];
}

interface GeocodingResult {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

export class PlacesImportService {
  private readonly PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
  private readonly GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY no está definida en las variables de entorno');
    }
    this.apiKey = apiKey;
  }

  private async getCoordinatesFromLocation(location: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await axios.get<GeocodingResult>(this.GEOCODING_API_URL, {
        params: {
          address: location,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Error en geocodificación: ${response.data.status}`);
      }

      return response.data.results[0].geometry.location;
    } catch (error) {
      logger.error('Error al obtener coordenadas:', error);
      throw new Error('Error al obtener coordenadas de la ubicación');
    }
  }

  private async searchPlaces(query: string, location: { lat: number; lng: number }, maxResults: number): Promise<PlaceResult[]> {
    try {
      const response = await axios.get(this.PLACES_API_URL, {
        params: {
          query,
          location: `${location.lat},${location.lng}`,
          radius: '5000', // 5km de radio
          key: this.apiKey,
          language: 'es'
        }
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Error en Places API: ${response.data.status}`);
      }

      return response.data.results.slice(0, maxResults);
    } catch (error) {
      logger.error('Error al buscar lugares:', error);
      throw new Error('Error al buscar lugares en Google Places');
    }
  }

  private async insertLead(place: PlaceResult): Promise<boolean> {
    const client = await pool.connect();
    try {
      logger.info(`Intentando insertar lead: ${place.name} (${place.place_id})`);
      await client.query('BEGIN');

      // Verificar si ya existe un lead con este place_id
      const existingLead = await client.query(
        'SELECT id FROM leads WHERE place_id = $1',
        [place.place_id]
      );

      if (existingLead.rows.length > 0) {
        logger.info(`Lead ya existe con place_id: ${place.place_id}`);
        await client.query('COMMIT');
        return false;
      }

      // Insertar nuevo lead
      const query = `
        INSERT INTO leads (
          name, 
          address, 
          coordinates,
          latitude,
          longitude,
          rating,
          place_id,
          category,
          type,
          status,
          priority,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING id
      `;

      const values = [
        place.name,
        place.formatted_address,
        JSON.stringify({
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng
        }),
        place.geometry.location.lat,
        place.geometry.location.lng,
        place.rating || null,
        place.place_id,
        place.types[0] || null,
        'empresa',
        'nuevo',
        'media'
      ];

      logger.info('Ejecutando query con valores:', values);
      const result = await client.query(query, values);
      logger.info(`Lead insertado exitosamente con ID: ${result.rows[0].id}`);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al insertar lead:', error);
      if (error instanceof Error) {
        logger.error('Detalles del error:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw new Error('Error al insertar lead en la base de datos');
    } finally {
      client.release();
    }
  }

  async importPlaces(query: string, location: string, maxResults: number = 20): Promise<{
    imported: number;
    skipped: number;
    data: any[];
  }> {
    try {
      // Obtener coordenadas de la ubicación
      const coordinates = await this.getCoordinatesFromLocation(location);

      // Buscar lugares
      const places = await this.searchPlaces(query, coordinates, maxResults);

      // Procesar resultados
      let imported = 0;
      let skipped = 0;
      const importedData = [];

      for (const place of places) {
        const wasInserted = await this.insertLead(place);
        if (wasInserted) {
          imported++;
          importedData.push({
            name: place.name,
            address: place.formatted_address,
            coordinates: place.geometry.location,
            rating: place.rating,
            category: place.types[0]
          });
        } else {
          skipped++;
        }
      }

      return {
        imported,
        skipped,
        data: importedData
      };
    } catch (error) {
      logger.error('Error en importación de lugares:', error);
      throw error;
    }
  }
} 