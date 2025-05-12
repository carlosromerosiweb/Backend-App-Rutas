export interface Location {
  lat: number;
  lng: number;
}

export interface Step {
  html_instructions: string;
  distance: {
    value: number; // metros
    text: string;
  };
  duration: {
    value: number; // segundos
    text: string;
  };
  start_location: Location;
  end_location: Location;
}

export interface Lead {
  id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

export interface DirectionsResponse {
  ordered_leads: Lead[];
  total_distance_km: number;
  total_duration_min: number;
  steps: Step[];
}

export interface GoogleDirectionsResponse {
  routes: Array<{
    legs: Array<{
      steps: Step[];
      distance: {
        value: number;
        text: string;
      };
      duration: {
        value: number;
        text: string;
      };
    }>;
    waypoint_order: number[];
  }>;
  status: string;
  error_message?: string;
} 