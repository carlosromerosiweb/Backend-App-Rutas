export interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  assigned_to: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  next_followup?: Date;
  last_contact?: Date;
  category?: string;
  priority?: string;
  source?: string;
  company?: string;
  position?: string;
  website?: string;
  social_media?: Record<string, string>;
  custom_fields?: Record<string, any>;
} 