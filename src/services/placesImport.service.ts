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
      logger.error('GOOGLE_MAPS_API_KEY no está definida en las variables de entorno');
      throw new Error('GOOGLE_MAPS_API_KEY no está definida en las variables de entorno');
    }
    this.apiKey = apiKey;
    logger.info('PlacesImportService inicializado correctamente');
  }

  private async getCoordinatesFromLocation(location: string): Promise<{ lat: number; lng: number }> {
    try {
      logger.info('Obteniendo coordenadas para ubicación', { location });
      
      const response = await axios.get<GeocodingResult>(this.GEOCODING_API_URL, {
        params: {
          address: location,
          key: this.apiKey
        }
      });

      logger.debug('Respuesta de geocodificación recibida', {
        status: response.data.status,
        resultsCount: response.data.results.length
      });

      if (response.data.status !== 'OK') {
        logger.error('Error en geocodificación', {
          status: response.data.status,
          location
        });
        throw new Error(`Error en geocodificación: ${response.data.status}`);
      }

      const coordinates = response.data.results[0].geometry.location;
      logger.info('Coordenadas obtenidas exitosamente', { coordinates });
      return coordinates;
    } catch (error) {
      logger.error('Error al obtener coordenadas:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        location
      });
      throw new Error('Error al obtener coordenadas de la ubicación');
    }
  }

  private async searchPlaces(query: string, location: { lat: number; lng: number }, maxResults: number): Promise<PlaceResult[]> {
    try {
      logger.info('Buscando lugares', {
        query,
        location,
        maxResults
      });

      const response = await axios.get(this.PLACES_API_URL, {
        params: {
          query,
          location: `${location.lat},${location.lng}`,
          radius: '5000', // 5km de radio
          key: this.apiKey,
          language: 'es'
        }
      });

      logger.debug('Respuesta de Places API recibida', {
        status: response.data.status,
        resultsCount: response.data.results?.length || 0
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        logger.error('Error en Places API', {
          status: response.data.status,
          query,
          location
        });
        throw new Error(`Error en Places API: ${response.data.status}`);
      }

      const results = response.data.results.slice(0, maxResults);
      logger.info('Lugares encontrados', {
        total: response.data.results.length,
        filtered: results.length
      });

      return results;
    } catch (error) {
      logger.error('Error al buscar lugares:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        query,
        location
      });
      throw new Error('Error al buscar lugares en Google Places');
    }
  }

  private async insertLead(place: PlaceResult): Promise<boolean> {
    const client = await pool.connect();
    try {
      logger.info('Intentando insertar lead', {
        name: place.name,
        place_id: place.place_id,
        address: place.formatted_address
      });

      await client.query('BEGIN');

      // Verificar si ya existe un lead con este place_id
      const existingLead = await client.query(
        'SELECT id FROM leads WHERE place_id = $1',
        [place.place_id]
      );

      if (existingLead.rows.length > 0) {
        logger.info('Lead ya existe', {
          place_id: place.place_id,
          existing_id: existingLead.rows[0].id
        });
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

      logger.debug('Ejecutando query de inserción', { values });
      const result = await client.query(query, values);
      logger.info('Lead insertado exitosamente', {
        id: result.rows[0].id,
        name: place.name
      });

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error al insertar lead:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        place: {
          name: place.name,
          place_id: place.place_id
        }
      });
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
      logger.info('Iniciando proceso de importación de lugares', {
        query,
        location,
        maxResults
      });

      // Obtener coordenadas de la ubicación
      const coordinates = await this.getCoordinatesFromLocation(location);

      // Buscar lugares
      const places = await this.searchPlaces(query, coordinates, maxResults);

      // Procesar resultados
      let imported = 0;
      let skipped = 0;
      const importedData = [];

      logger.info('Procesando resultados encontrados', {
        totalPlaces: places.length
      });

      for (const place of places) {
        try {
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
        } catch (error) {
          logger.error('Error al procesar lugar individual:', {
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack
            } : error,
            place: {
              name: place.name,
              place_id: place.place_id
            }
          });
          skipped++;
        }
      }

      logger.info('Proceso de importación completado', {
        imported,
        skipped,
        totalProcessed: places.length
      });

      return {
        imported,
        skipped,
        data: importedData
      };
    } catch (error) {
      logger.error('Error en importación de lugares:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        query,
        location
      });
      throw error;
    }
  }
} 