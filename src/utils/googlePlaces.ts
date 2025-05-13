import axios from 'axios';
import { config } from '../config';

interface Location {
  lat: number;
  lng: number;
}

interface Geometry {
  location: Location;
}

interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: Geometry;
  rating?: number;
  types?: string[];
}

interface PlacesResponse {
  results: Place[];
  next_page_token?: string;
  status: string;
}

interface SearchPlacesParams {
  latitude: number;
  longitude: number;
  radius: number;
  rating_min?: number;
  open_now?: boolean;
  categories?: string[];
  keywords?: string;
  pageToken?: string;
}

export class GooglePlacesAPI {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    if (!config.googleMapsApiKey) {
      throw new Error('Google Maps API key no configurada');
    }
    this.apiKey = config.googleMapsApiKey;
  }

  async searchPlaces(params: SearchPlacesParams): Promise<PlacesResponse> {
    const endpoint = params.keywords ? 'textsearch' : 'nearbysearch';
    const location = `${params.latitude},${params.longitude}`;

    const queryParams = new URLSearchParams({
      location,
      radius: params.radius.toString(),
      key: this.apiKey,
    });

    if (params.keywords) {
      queryParams.append('query', params.keywords);
    }

    if (params.open_now) {
      queryParams.append('opennow', 'true');
    }

    if (params.categories?.length) {
      queryParams.append('type', params.categories[0]); // Google solo acepta un tipo a la vez
    }

    if (params.pageToken) {
      queryParams.append('pagetoken', params.pageToken);
    }

    try {
      const response = await axios.get<PlacesResponse>(
        `${this.baseUrl}/${endpoint}/json?${queryParams.toString()}`
      );

      if (response.data.status === 'OK') {
        return {
          results: response.data.results.filter(
            place => !params.rating_min || (place.rating && place.rating >= params.rating_min)
          ),
          next_page_token: response.data.next_page_token,
          status: response.data.status
        };
      }

      throw new Error(`Error en Google Places API: ${response.data.status}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Error en la llamada a Google Places API: ${error.message}`);
      }
      throw error;
    }
  }
} 