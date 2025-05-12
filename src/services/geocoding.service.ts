import axios from 'axios';
import { logger } from '../utils/logger';

interface GeocodingResponse {
  latitude: number;
  longitude: number;
}

export class GeocodingService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY no está definida en las variables de entorno');
    }
    this.apiKey = apiKey;
    logger.info('GeocodingService inicializado correctamente');
  }

  /**
   * Geocodifica una dirección a coordenadas (latitud, longitud)
   * @param address Dirección completa a geocodificar
   * @returns Objeto con latitud y longitud
   * @throws Error si la geocodificación falla
   */
  public async geocodeAddress(address: string): Promise<GeocodingResponse> {
    try {
      // Verificar que la dirección no esté vacía
      if (!address || address.trim().length === 0) {
        throw new Error('La dirección no puede estar vacía');
      }

      // Mostrar información de debug
      console.log('\x1b[33m%s\x1b[0m', '[Geocoding API] Configuración:');
      console.log('\x1b[33m%s\x1b[0m', `[Geocoding API] URL: ${this.baseUrl}`);
      console.log('\x1b[33m%s\x1b[0m', `[Geocoding API] API Key: ${this.apiKey.substring(0, 5)}...${this.apiKey.substring(this.apiKey.length - 5)}`);
      console.log('\x1b[33m%s\x1b[0m', `[Geocoding API] Geocodificando dirección: ${address}`);
      
      const response = await axios.get(this.baseUrl, {
        params: {
          address,
          key: this.apiKey
        }
      });

      // Log de la respuesta completa para debug
      logger.debug('Respuesta de Google Geocoding API:', {
        status: response.data.status,
        results: response.data.results?.length || 0
      });

      if (response.data.status !== 'OK') {
        const errorMessage = `Error en geocodificación: ${response.data.status} - ${response.data.error_message || 'Sin mensaje de error'}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error('No se encontraron resultados para la dirección proporcionada');
      }

      const location = response.data.results[0].geometry.location;
      
      console.log('\x1b[33m%s\x1b[0m', `[Geocoding API] Coordenadas obtenidas: ${location.lat}, ${location.lng}`);
      
      return {
        latitude: location.lat,
        longitude: location.lng
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Error en la petición a Google Geocoding API:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        throw new Error(`Error en la petición a Google Geocoding API: ${error.message}`);
      }
      
      logger.error('Error al geocodificar dirección:', error);
      throw error;
    }
  }
}

// Exportar una instancia única del servicio
export const geocodingService = new GeocodingService(); 