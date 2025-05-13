export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: Date;
  refresh_token: string | null;
}

export interface RegisterUserDto {
  email: string;
  password: string;
  name: string;
  role?: string; // Haciendo el rol opcional
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  id: string;
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface RouteStep {
  order: number;
  lead_id: string;
  lead_name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_to_next?: number;
  duration_to_next?: number;
}

export interface OptimizedRoute {
  route_summary: {
    total_distance: number;
    total_duration: number;
  };
  steps: RouteStep[];
  origin: {
    latitude: number;
    longitude: number;
  };
  date: string;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  name: string;
  email: string;
  role: string;
}
