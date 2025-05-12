/**
 * Tipos para la gestión de leads/clientes potenciales
 */
import { User } from '../index';

/**
 * Estado del lead en el proceso comercial
 */
export enum LeadStatus {
  NEW = 'nuevo',              // Nuevo lead sin contactar
  CONTACTED = 'contactado',   // Lead contactado inicialmente
  INTERESTED = 'interesado',  // Lead interesado en el producto/servicio
  NEGOTIATION = 'negociacion', // En proceso de negociación
  CUSTOMER = 'cliente',       // Convertido a cliente
  LOST = 'perdido',           // Lead perdido/no interesado
  INACTIVE = 'inactivo'       // Cliente inactivo
}

/**
 * Tipo de lead/cliente
 */
export enum LeadType {
  INDIVIDUAL = 'individual',  // Persona física
  COMPANY = 'empresa',        // Empresa/organización
  GOVERNMENT = 'gobierno',    // Entidad gubernamental
  NGO = 'ong'                 // Organización sin ánimo de lucro
}

/**
 * Prioridad del lead
 */
export enum LeadPriority {
  LOW = 'baja',        // Prioridad baja
  MEDIUM = 'media',    // Prioridad media
  HIGH = 'alta',       // Prioridad alta
  URGENT = 'urgente'   // Prioridad urgente
}

/**
 * Lead/Cliente potencial
 */
export interface Lead {
  id: number;                   // ID único del lead
  name: string;                 // Nombre del lead o empresa
  email?: string;               // Email de contacto
  phone?: string;               // Teléfono de contacto
  address?: string;             // Dirección física
  city?: string;                // Ciudad
  postal_code?: string;         // Código postal
  country?: string;             // País (por defecto España)
  type: LeadType;               // Tipo de lead
  status: LeadStatus;           // Estado actual en el proceso
  priority: LeadPriority;       // Prioridad de atención
  assigned_to?: number;         // ID del comercial asignado
  notes?: string;               // Notas generales
  estimated_value?: number;     // Valor estimado de venta
  created_at: Date;             // Fecha de creación
  updated_at: Date;             // Fecha de última actualización
  last_contact?: Date;          // Fecha de último contacto
  next_followup?: Date;         // Fecha programada para próximo seguimiento
  coordinates?: {               // Coordenadas para geolocalización
    latitude: number;
    longitude: number;
  };
  tags?: string[];              // Etiquetas para categorización
}

/**
 * DTO para crear un nuevo lead
 */
export interface CreateLeadDto {
  name: string;                 // Nombre del lead o empresa (obligatorio)
  email?: string;               // Email de contacto
  phone?: string;               // Teléfono de contacto
  address?: string;             // Dirección física
  city?: string;                // Ciudad
  postal_code?: string;         // Código postal
  country?: string;             // País
  type: LeadType;               // Tipo de lead (obligatorio)
  status?: LeadStatus;          // Estado inicial (por defecto: NEW)
  priority?: LeadPriority;      // Prioridad (por defecto: MEDIUM)
  assigned_to?: number;         // ID del comercial asignado
  notes?: string;               // Notas iniciales
  estimated_value?: number;     // Valor estimado
  tags?: string[];              // Etiquetas
  coordinates?: {               // Coordenadas
    latitude: number;
    longitude: number;
  };
  next_followup?: Date;         // Fecha para próximo seguimiento
}

/**
 * DTO para actualizar un lead existente
 */
export interface UpdateLeadDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  type?: LeadType;
  status?: LeadStatus;
  priority?: LeadPriority;
  assigned_to?: number;
  notes?: string;
  estimated_value?: number;
  tags?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  next_followup?: Date;
}

/**
 * Filtros para búsqueda de leads
 */
export interface LeadFilters {
  status?: LeadStatus;
  type?: LeadType;
  priority?: LeadPriority;
  assigned_to?: number;
  search?: string;               // Búsqueda por nombre, email, teléfono
  city?: string;
  country?: string;
  created_after?: Date;
  created_before?: Date;
  updated_after?: Date;
  updated_before?: Date;
  tags?: string[];
  next_followup_after?: Date;    // Filtro para seguimientos después de una fecha
  next_followup_before?: Date;   // Filtro para seguimientos antes de una fecha
}

/**
 * Interacción/actividad con un lead
 */
export interface LeadInteraction {
  id: number;
  lead_id: number;              // ID del lead relacionado
  type: string;                 // Tipo de interacción: llamada, email, visita, etc.
  notes: string;                // Notas de la interacción
  outcome?: string;             // Resultado de la interacción
  user_id: number;              // Usuario que realizó la interacción
  date: Date;                   // Fecha de la interacción
  duration?: number;            // Duración en minutos (opcional)
  location?: {                  // Ubicación donde ocurrió (opcional)
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at: Date;
  updated_at: Date;
}

/**
 * DTO para crear una nueva interacción
 */
export interface CreateLeadInteractionDto {
  lead_id: number;
  type: string;
  notes: string;
  outcome?: string;
  date?: Date;                   // Por defecto, fecha actual
  duration?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

/**
 * Resumen de lead para listados
 */
export interface LeadSummary {
  id: number;
  name: string;
  type: LeadType;
  status: LeadStatus;
  priority: LeadPriority;
  assigned_to?: number;
  assigned_user?: {
    id: number;
    name: string;
  };
  city?: string;
  last_contact?: Date;
  next_followup?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Respuesta paginada para listados de leads
 */
export interface PaginatedLeadResponse {
  leads: LeadSummary[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}