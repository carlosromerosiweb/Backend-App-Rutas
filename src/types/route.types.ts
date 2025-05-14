import { z } from 'zod';

// Esquemas de validación
export const createRouteSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  team_id: z.number().int().positive('El ID del equipo debe ser un número positivo'),
  status: z.enum(['active', 'inactive']).default('active')
});

export const updateRouteSchema = createRouteSchema.partial();

export const assignUserSchema = z.object({
  user_id: z.number().int().positive('El ID del usuario debe ser un número positivo')
});

export const assignLeadsSchema = z.object({
  lead_ids: z.array(z.number().int().positive('El ID del lead debe ser un número positivo'))
});

// Tipos inferidos de los esquemas
export type CreateRouteDto = z.infer<typeof createRouteSchema>;
export type UpdateRouteDto = z.infer<typeof updateRouteSchema>;
export type AssignUserDto = z.infer<typeof assignUserSchema>;
export type AssignLeadsDto = z.infer<typeof assignLeadsSchema>;

// Interfaces adicionales
export interface Route {
  id: number;
  name: string;
  description?: string;
  team_id: number;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  created_by: number;
}

export interface RouteAssignment {
  id: number;
  route_id: number;
  user_id: number;
  assigned_at: Date;
  assigned_by: number;
}

export interface RouteLead {
  id: number;
  route_id: number;
  lead_id: number;
  assigned_at: Date;
  assigned_by: number;
}

// Tipos para respuestas
export interface RouteWithAssignments extends Route {
  users: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  leads: Array<{
    id: number;
    name: string;
    order?: number;
  }>;
} 