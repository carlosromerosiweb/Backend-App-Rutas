import fs from 'fs';
import csv from 'csv-parser';
import { Pool } from 'pg';
import db from '../db';
import { logger } from '../utils/logger';
import { CreateLeadDto, LeadPriority, LeadStatus, LeadType } from '../types/leads';
import { leadService } from './lead.service';
import { geocodingService } from './geocoding.service';
import axios from 'axios';

class ImportGeocodeService {
  private pool: Pool;
  private readonly PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  private readonly PLACES_DETAILS_API_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
  private readonly apiKey: string;

  constructor() {
    this.pool = db;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY no está definida en las variables de entorno');
    }
    this.apiKey = apiKey;
  }

  /**
   * Importa leads desde un archivo CSV y los geocodifica
   * @param filePath Ruta al archivo CSV
   * @param defaultAssignedTo ID de usuario al que asignar los leads por defecto (opcional)
   * @returns Estadísticas de importación
   */
  public async importAndGeocodeLeadsFromCsv(
    filePath: string,
    defaultAssignedTo?: number
  ): Promise<{ 
    total: number, 
    success: number, 
    failed: number, 
    errors: Array<{ line: number, error: string }> 
  }> {
    logger.info('Iniciando importación y geocodificación desde CSV:', { filePath, defaultAssignedTo });
    
    const stats = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [] as Array<{ line: number, error: string }>
    };

    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let lineCounter = 0;
      
      logger.info('Iniciando lectura del archivo CSV');
      
      fs.createReadStream(filePath)
        .pipe(csv({
          mapHeaders: ({ header }) => {
            logger.debug('Procesando encabezado CSV:', { header });
            const normalized = header.toLowerCase().trim();
            
            switch (normalized) {
              case 'dirección': case 'direccion': case 'address': case 'dir': case 'direccion completa': case 'dirección completa': return 'address';
              case 'código postal': case 'codigo postal': case 'cp': case 'postal_code': case 'postal code': case 'código-postal': case 'codigo-postal': return 'postal_code';
              default: return header;
            }
          }
        }))
        .on('data', (data) => {
          lineCounter++;
          stats.total++;
          logger.debug('Leyendo línea del CSV:', { line: lineCounter, data });
          results.push({ line: lineCounter, data });
        })
        .on('end', async () => {
          logger.info('Finalizada lectura del CSV. Total de líneas:', { total: results.length });
          
          // Procesar cada registro
          for (const result of results) {
            try {
              logger.info('Procesando línea:', { line: result.line });
              
              // Extraer dirección, código postal y nombre
              const { address, postal_code, name } = this.extractAddressAndPostalCode(result.data);
              logger.info('Datos extraídos:', { address, postal_code, name });
              
              if (!address) {
                logger.error('No se encontró dirección válida en la línea:', { line: result.line, data: result.data });
                stats.failed++;
                stats.errors.push({ 
                  line: result.line, 
                  error: 'No se encontró una dirección válida' 
                });
                continue;
              }

              // Geocodificar la dirección
              logger.info('Geocodificando dirección:', { address });
              const coordinates = await geocodingService.geocodeAddress(address);
              logger.info('Coordenadas obtenidas:', coordinates);
              
              // Buscar lugares cercanos
              logger.info('Buscando lugares cercanos:', { coordinates, name });
              const places = await this.searchNearbyPlaces(coordinates, name || undefined);
              
              logger.info('Respuesta de Places API:', {
                places: places.map(p => ({
                  name: p.name,
                  place_id: p.place_id,
                  address: p.vicinity,
                  rating: p.rating,
                  types: p.types
                }))
              });
              
              if (places.length === 0) {
                logger.error('No se encontraron lugares cercanos:', { address, coordinates });
                stats.failed++;
                stats.errors.push({ 
                  line: result.line, 
                  error: 'No se encontraron lugares cercanos' 
                });
                continue;
              }

              // Obtener detalles del lugar
              logger.info('Obteniendo detalles del lugar:', { place_id: places[0].place_id });
              const placeDetails = await this.getPlaceDetails(places[0].place_id);
              logger.info('Detalles del lugar obtenidos:', placeDetails);
              
              // Crear el lead
              const leadDto: CreateLeadDto = {
                name: places[0].name,
                address: places[0].vicinity || places[0].formatted_address,
                coordinates: {
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude
                },
                postal_code: postal_code || this.extractPostalCode(places[0].vicinity || places[0].formatted_address) || undefined,
                type: LeadType.COMPANY,
                status: LeadStatus.NEW,
                priority: LeadPriority.MEDIUM,
                assigned_to: defaultAssignedTo,
                phone: placeDetails?.formatted_phone_number || placeDetails?.international_phone_number || undefined
              };

              logger.info('Creando lead con datos:', leadDto);
              const lead = await leadService.createLead(leadDto);
              
              if (!lead) {
                logger.error('Error al crear lead en la base de datos:', { leadDto });
                stats.failed++;
                stats.errors.push({ 
                  line: result.line, 
                  error: 'Error al crear el lead en la base de datos' 
                });
                continue;
              }

              // Actualizar campos adicionales
              const updateQuery = `
                UPDATE leads 
                SET place_id = $1, 
                    rating = $2, 
                    category = $3,
                    latitude = $4,
                    longitude = $5
                WHERE id = $6
              `;
              
              const updateValues = [
                places[0].place_id,
                places[0].rating || placeDetails?.rating || null,
                places[0].types.find((type: string) => 
                  ['store', 'restaurant', 'cafe', 'bar', 'food', 'point_of_interest', 'establishment'].includes(type)
                ) || null,
                coordinates.latitude,
                coordinates.longitude,
                lead.id
              ];

              logger.info('Actualizando campos adicionales:', {
                query: updateQuery,
                values: updateValues
              });

              await this.pool.query(updateQuery, updateValues);
              logger.info('Lead creado y actualizado exitosamente:', {
                id: lead.id,
                name: lead.name,
                address: lead.address,
                place_id: places[0].place_id
              });

              stats.success++;
            } catch (error) {
              logger.error('Error procesando línea:', { 
                line: result.line, 
                error: error instanceof Error ? error.message : 'Error desconocido',
                stack: error instanceof Error ? error.stack : undefined
              });
              stats.failed++;
              stats.errors.push({ 
                line: result.line, 
                error: error instanceof Error ? error.message : 'Error desconocido' 
              });
            }
          }
          
          logger.info('Proceso completado. Estadísticas:', stats);
          
          // Eliminar el archivo temporal
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.error('Error al eliminar archivo temporal:', err);
            }
          });
          
          resolve(stats);
        })
        .on('error', (error) => {
          logger.error('Error procesando CSV:', error);
          reject(error);
        });
    });
  }

  /**
   * Extrae la dirección, código postal y nombre de los datos del CSV
   */
  private extractAddressAndPostalCode(data: any): { address: string | null; postal_code: string | null; name: string | null } {
    let address = null;
    let postal_code = null;
    let name = null;

    // Buscar dirección
    const addressFields = ['address', 'direccion', 'dirección', 'dir', 'direccion completa', 'dirección completa'];
    for (const field of addressFields) {
      if (data[field]) {
        address = data[field];
        break;
      }
    }

    // Buscar código postal
    const postalFields = ['postal_code', 'codigo postal', 'código postal', 'cp', 'postal code', 'código-postal', 'codigo-postal'];
    for (const field of postalFields) {
      if (data[field]) {
        postal_code = data[field];
        break;
      }
    }

    // Buscar nombre
    const nameFields = ['name', 'nombre', 'business_name', 'business name', 'nombre del negocio', 'nombre negocio'];
    for (const field of nameFields) {
      if (data[field]) {
        name = data[field];
        break;
      }
    }

    return { address, postal_code, name };
  }

  /**
   * Busca lugares cercanos usando las coordenadas
   */
  private async searchNearbyPlaces(coordinates: { latitude: number; longitude: number }, name?: string): Promise<any[]> {
    try {
      const params: any = {
        location: `${coordinates.latitude},${coordinates.longitude}`,
        radius: '20',
        key: this.apiKey
      };

      // Si tenemos un nombre, lo usamos como keyword en lugar de name
      if (name) {
        params.keyword = name;
      }

      const response = await axios.get(this.PLACES_API_URL, { params });

      if (response.data.status === 'ZERO_RESULTS') {
        // Si no hay resultados con el keyword, intentamos sin él
        if (name) {
          delete params.keyword;
          const retryResponse = await axios.get(this.PLACES_API_URL, { params });
          if (retryResponse.data.status === 'OK') {
            return this.filterPlacesResults(retryResponse.data.results);
          }
        }
        throw new Error(`Error en Places API: ${response.data.status}`);
      }

      if (response.data.status !== 'OK') {
        throw new Error(`Error en Places API: ${response.data.status}`);
      }

      return this.filterPlacesResults(response.data.results);
    } catch (error) {
      logger.error('Error al buscar lugares cercanos:', error);
      throw error;
    }
  }

  private filterPlacesResults(results: any[]): any[] {
    return results.filter((place: any) => {
      // Excluir resultados que son solo rutas o localidades
      if (place.types.includes('route') || place.types.includes('locality')) {
        return false;
      }
      // Priorizar lugares con rating y tipos de establecimiento
      return place.types.some((type: string) => 
        ['store', 'restaurant', 'cafe', 'bar', 'food', 'point_of_interest', 'establishment'].includes(type)
      );
    });
  }

  /**
   * Obtiene detalles de un lugar específico
   */
  private async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await axios.get(this.PLACES_DETAILS_API_URL, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,formatted_phone_number,international_phone_number,website,rating,types,vicinity',
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Error al obtener detalles del lugar: ${response.data.status}`);
      }

      return response.data.result;
    } catch (error) {
      logger.error('Error al obtener detalles del lugar:', error);
      throw error;
    }
  }

  /**
   * Extrae el código postal de una dirección formateada
   */
  private extractPostalCode(address: string): string | null {
    const postalCodeMatch = address.match(/\b\d{5}\b/);
    return postalCodeMatch ? postalCodeMatch[0] : null;
  }
}

// Exportar una instancia única del servicio
export const importGeocodeService = new ImportGeocodeService(); 