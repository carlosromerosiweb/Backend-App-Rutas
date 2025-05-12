/**
 * Servicio para importación de datos desde CSV
 */
import fs from 'fs';
import { Pool } from 'pg';
import csv from 'csv-parser';
import db from '../db';
import { logger } from '../utils/logger';
import { CreateLeadDto, LeadPriority, LeadStatus, LeadType } from '../types/leads';
import { leadService } from './lead.service';

class ImportService {
  private pool: Pool;

  constructor() {
    this.pool = db;  // db ya es un pool
  }

  /**
   * Importa leads desde un archivo CSV
   * @param filePath Ruta al archivo CSV
   * @param defaultAssignedTo ID de usuario al que asignar los leads por defecto (opcional)
   * @returns Estadísticas de importación
   */
  public async importLeadsFromCsv(
    filePath: string,
    defaultAssignedTo?: number
  ): Promise<{ 
    total: number, 
    success: number, 
    failed: number, 
    errors: Array<{ line: number, error: string }> 
  }> {
    const stats = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [] as Array<{ line: number, error: string }>
    };

    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let lineCounter = 0;
      
      fs.createReadStream(filePath)
        .pipe(csv({
          // Mapeo de cabeceras por defecto. Esto se puede hacer configurable
          mapHeaders: ({ header }) => {
            // Normalizar y transformar nombres de columnas comunes
            const normalized = header.toLowerCase().trim();
            
            // Mapeo de nombres de columnas comunes en español a nombres de campos
            switch (normalized) {
              case 'nombre': return 'name';
              case 'correo': case 'email': case 'correo electrónico': case 'e-mail': return 'email';
              case 'teléfono': case 'telefono': case 'tel': case 'phone': return 'phone';
              case 'dirección': case 'direccion': case 'address': return 'address';
              case 'ciudad': case 'city': return 'city';
              case 'código postal': case 'codigo postal': case 'cp': case 'postal_code': return 'postal_code';
              case 'país': case 'pais': case 'country': return 'country';
              case 'tipo': case 'type': return 'type';
              case 'estado': case 'status': return 'status';
              case 'prioridad': case 'priority': return 'priority';
              case 'notas': case 'notes': return 'notes';
              case 'valor estimado': case 'valor': case 'estimated_value': return 'estimated_value';
              case 'etiquetas': case 'tags': return 'tags';
              case 'latitud': case 'latitude': return 'latitude';
              case 'longitud': case 'longitude': return 'longitude';
              case 'siguiente contacto': case 'próximo contacto': case 'next_followup': return 'next_followup';
              default: return header; // Mantener el original si no hay mapeo
            }
          }
        }))
        .on('data', (data) => {
          lineCounter++;
          stats.total++;
          results.push({ line: lineCounter, data });
        })
        .on('end', async () => {
          // Procesar cada registro
          for (const result of results) {
            try {
              const leadDto = this.mapCsvRowToLeadDto(result.data, defaultAssignedTo);
              const lead = await leadService.createLead(leadDto);
              
              if (lead) {
                stats.success++;
              } else {
                stats.failed++;
                stats.errors.push({ 
                  line: result.line, 
                  error: 'Error al crear el lead en la base de datos' 
                });
              }
            } catch (error) {
              stats.failed++;
              stats.errors.push({ 
                line: result.line, 
                error: error instanceof Error ? error.message : 'Error desconocido' 
              });
              logger.error(`Error procesando línea ${result.line} del CSV:`, error);
            }
          }
          
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
   * Mapea una fila del CSV a un DTO para crear un lead
   * @param row Fila del CSV
   * @param defaultAssignedTo ID de usuario por defecto (opcional)
   * @returns DTO para crear un lead
   */
  private mapCsvRowToLeadDto(row: any, defaultAssignedTo?: number): CreateLeadDto {
    // Validar y normalizar tipo
    let type: LeadType;
    if (row.type) {
      const normalizedType = row.type.toLowerCase().trim();
      switch (normalizedType) {
        case 'individual': case 'persona': case 'person':
          type = LeadType.INDIVIDUAL;
          break;
        case 'empresa': case 'company': case 'business':
          type = LeadType.COMPANY;
          break;
        case 'gobierno': case 'government': case 'gov':
          type = LeadType.GOVERNMENT;
          break;
        case 'ong': case 'ngo': case 'organización sin ánimo de lucro':
          type = LeadType.NGO;
          break;
        default:
          type = LeadType.COMPANY; // Valor por defecto
      }
    } else {
      type = LeadType.COMPANY; // Valor por defecto
    }

    // Validar y normalizar estado
    let status: LeadStatus | undefined;
    if (row.status) {
      const normalizedStatus = row.status.toLowerCase().trim();
      switch (normalizedStatus) {
        case 'nuevo': case 'new': case 'sin contactar':
          status = LeadStatus.NEW;
          break;
        case 'contactado': case 'contacted':
          status = LeadStatus.CONTACTED;
          break;
        case 'interesado': case 'interested':
          status = LeadStatus.INTERESTED;
          break;
        case 'negociacion': case 'negociación': case 'negotiation':
          status = LeadStatus.NEGOTIATION;
          break;
        case 'cliente': case 'customer': case 'client':
          status = LeadStatus.CUSTOMER;
          break;
        case 'perdido': case 'lost':
          status = LeadStatus.LOST;
          break;
        case 'inactivo': case 'inactive':
          status = LeadStatus.INACTIVE;
          break;
        default:
          status = undefined; // Usar valor por defecto del servicio
      }
    }

    // Validar y normalizar prioridad
    let priority: LeadPriority | undefined;
    if (row.priority) {
      const normalizedPriority = row.priority.toLowerCase().trim();
      switch (normalizedPriority) {
        case 'baja': case 'low':
          priority = LeadPriority.LOW;
          break;
        case 'media': case 'medium':
          priority = LeadPriority.MEDIUM;
          break;
        case 'alta': case 'high':
          priority = LeadPriority.HIGH;
          break;
        case 'urgente': case 'urgent':
          priority = LeadPriority.URGENT;
          break;
        default:
          priority = undefined; // Usar valor por defecto del servicio
      }
    }

    // Procesar etiquetas
    let tags: string[] | undefined;
    if (row.tags) {
      // Las etiquetas pueden estar separadas por comas, punto y coma o espacios
      tags = row.tags.split(/[,;\s]+/).map((tag: string) => tag.trim()).filter((tag: string) => tag);
    }

    // Procesar coordenadas
    let coordinates;
    if (row.latitude && row.longitude) {
      const latitude = parseFloat(row.latitude);
      const longitude = parseFloat(row.longitude);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        coordinates = { latitude, longitude };
      }
    }

    // Procesar fecha de próximo seguimiento
    let nextFollowup: Date | undefined;
    if (row.next_followup) {
      try {
        nextFollowup = new Date(row.next_followup);
        // Verificar si la fecha es válida
        if (isNaN(nextFollowup.getTime())) {
          nextFollowup = undefined;
        }
      } catch (error) {
        // Ignorar errores de parsing de fecha
        nextFollowup = undefined;
      }
    }

    // Validar campos requeridos
    if (!row.name) {
      throw new Error('El campo nombre es obligatorio');
    }

    // Crear el DTO
    const leadDto: CreateLeadDto = {
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      city: row.city,
      postal_code: row.postal_code,
      country: row.country,
      type,
      status,
      priority,
      assigned_to: defaultAssignedTo,
      notes: row.notes,
      estimated_value: row.estimated_value ? parseFloat(row.estimated_value) : undefined,
      tags,
      coordinates,
      next_followup: nextFollowup
    };

    return leadDto;
  }
}

export const importService = new ImportService();