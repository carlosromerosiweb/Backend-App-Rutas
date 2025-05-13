import { GooglePlacesAPI } from '../utils/googlePlaces';
import pool from '../db';
import { PlacesImportRequest, PlacesImportResponse } from '../types/placesImport';
import { SystemLogService } from './systemLogService';

export class PlacesImportService {
  private googlePlaces: GooglePlacesAPI;
  private systemLog: SystemLogService;

  constructor() {
    this.googlePlaces = new GooglePlacesAPI();
    this.systemLog = new SystemLogService();
  }

  async importPlaces(
    userId: number,
    request: PlacesImportRequest
  ): Promise<PlacesImportResponse> {
    const response: PlacesImportResponse = {
      success: true,
      total_found: 0,
      inserted: 0,
      duplicates: 0,
      errors: []
    };

    try {
      let nextPageToken: string | undefined;
      let totalProcessed = 0;

      do {
        const places = await this.googlePlaces.searchPlaces({
          latitude: request.latitude,
          longitude: request.longitude,
          radius: request.radius,
          rating_min: request.rating_min,
          open_now: request.open_now,
          categories: request.categories,
          keywords: request.keywords,
          pageToken: nextPageToken
        });

        for (const place of places.results) {
          totalProcessed++;

          // Validar duplicados
          const existingLead = await pool.query(
            'SELECT * FROM leads WHERE place_id = $1 AND latitude = $2 AND longitude = $3',
            [place.place_id, place.geometry.location.lat, place.geometry.location.lng]
          );

          if (existingLead.rows.length > 0) {
            response.duplicates++;
            continue;
          }

          // Insertar nuevo lead
          await pool.query(
            `INSERT INTO leads (
              name, address, latitude, longitude, rating, place_id, 
              type, category, status, priority, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
            [
              place.name,
              place.formatted_address,
              place.geometry.location.lat,
              place.geometry.location.lng,
              place.rating || 0,
              place.place_id,
              place.types?.[0] || 'unknown',
              request.categories?.[0] || 'general',
              'nuevo',
              'media'
            ]
          );

          response.inserted++;
        }

        nextPageToken = places.next_page_token;
        
        // Esperar 2 segundos antes de la siguiente página (requerido por Google)
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } while (nextPageToken && totalProcessed < request.maxResults);

      response.total_found = totalProcessed;

      // Registrar en logs
      await this.systemLog.create({
        user_id: userId,
        action: 'places_import',
        details: {
          filters: request,
          total_found: response.total_found,
          inserted: response.inserted,
          duplicates: response.duplicates
        }
      });

    } catch (error) {
      response.success = false;
      response.errors.push(error instanceof Error ? error.message : 'Error desconocido');
      
      await this.systemLog.create({
        user_id: userId,
        action: 'places_import_error',
        details: {
          error: error instanceof Error ? error.message : 'Error desconocido',
          filters: request
        }
      });
    }

    return response;
  }
} 