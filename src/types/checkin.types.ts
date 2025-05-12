import { Lead } from './lead.types';

export interface CheckInLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: Date;
}

export interface AutoCheckInRequest {
  location: CheckInLocation;
  radius?: number; // Radio en metros, opcional
  notes?: string;
  files?: Express.Multer.File[]; // Archivos adjuntos
  next_followup?: Date; // Fecha sugerida para siguiente seguimiento
}

export interface CheckInResult {
  success: boolean;
  lead?: Lead;
  distance?: number; // Distancia en metros
  message: string;
  next_followup?: Date; // Fecha sugerida para siguiente seguimiento
}

export interface CheckInRecord {
  id: number;
  lead_id: number;
  user_id: number;
  status: string;
  notes?: string;
  location_lat: number;
  location_lng: number;
  timestamp?: Date;
  created_at: Date;
  updated_at?: Date;
  attachment_urls?: string[]; // Array de URLs de archivos adjuntos
}

export interface LeadInteraction {
  id: number;
  lead_id: number;
  user_id: number;
  interaction_type: string;
  notes?: string;
  attachment_urls?: string[];
  lead_status: string;
  created_at: Date;
}

export interface UserActivity {
  id: number;
  user_id: number;
  action_type: string;
  lead_id?: number;
  notes?: string;
  attachment_urls?: string[];
  created_at: Date;
} 