import { z } from 'zod';

export const PlacesImportSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(0).max(50000).default(5000),
  rating_min: z.number().min(0).max(5).optional().default(0),
  open_now: z.boolean().optional(),
  categories: z.array(z.string()).optional(),
  keywords: z.string().optional(),
  maxResults: z.number().min(1).max(200).default(200)
});

export type PlacesImportRequest = z.infer<typeof PlacesImportSchema>;

export interface PlacesImportResponse {
  success: boolean;
  total_found: number;
  inserted: number;
  duplicates: number;
  errors: string[];
} 