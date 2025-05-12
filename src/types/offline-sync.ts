import { z } from 'zod';

// Esquema base para datos offline
const offlineDataBaseSchema = z.object({
  local_id: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Esquema para leads offline
export const offlineLeadSchema = offlineDataBaseSchema.extend({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  estimated_value: z.number().optional(),
  status: z.string(),
  next_followup: z.string().datetime().optional(),
});

// Esquema para check-ins offline
export const offlineCheckinSchema = offlineDataBaseSchema.extend({
  lead_id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

// Esquema para interacciones offline
export const offlineLeadInteractionSchema = offlineDataBaseSchema.extend({
  lead_id: z.string(),
  type: z.enum(['call', 'visit', 'email', 'whatsapp', 'other']),
  notes: z.string(),
});

// Esquema para el payload de sincronización
export const offlineSyncSchema = z.object({
  leads: z.array(offlineLeadSchema),
  checkins: z.array(offlineCheckinSchema),
  lead_interactions: z.array(offlineLeadInteractionSchema),
});

// Tipos exportados
export type OfflineLead = z.infer<typeof offlineLeadSchema>;
export type OfflineCheckin = z.infer<typeof offlineCheckinSchema>;
export type OfflineLeadInteraction = z.infer<typeof offlineLeadInteractionSchema>;
export type OfflineSyncPayload = z.infer<typeof offlineSyncSchema>;

// Tipo para la respuesta de sincronización
export type SyncResponse = {
  success: boolean;
  data?: {
    leads: any[];
    checkins: any[];
    lead_interactions: any[];
  };
  error?: string;
}; 