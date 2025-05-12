import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';

class GoogleCalendarService {
  private oauth2Client: OAuth2Client;
  private static instance: GoogleCalendarService;
  private tokens: { [key: string]: any } = {};

  private constructor() {
    console.log('Inicializando GoogleCalendarService...');
    console.log('Configuración de Google:', {
      clientId: config.googleClientId,
      redirectUri: config.googleRedirectUri
    });

    this.oauth2Client = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.googleRedirectUri
    );
    console.log('OAuth2Client inicializado correctamente');
  }

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      console.log('Creando nueva instancia de GoogleCalendarService');
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  public getAuthUrl(): string {
    console.log('Generando URL de autenticación...');
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      prompt: 'consent',
      include_granted_scopes: true
    });
    console.log('URL de autenticación generada:', authUrl);
    return authUrl;
  }

  public async getTokens(code: string): Promise<any> {
    try {
      console.log('Obteniendo tokens con el código:', code);
      const { tokens } = await this.oauth2Client.getToken(code);
      console.log('Tokens obtenidos exitosamente');
      return tokens;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al obtener tokens:', errorMessage);
      throw new Error('Error al obtener tokens: ' + errorMessage);
    }
  }

  public setTokens(userId: string, tokens: any): void {
    console.log('Guardando tokens para el usuario:', userId);
    this.tokens[userId] = tokens;
    this.oauth2Client.setCredentials(tokens);
    console.log('Tokens guardados exitosamente');
  }

  public async createEvent(userId: string, eventDetails: {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    location: string;
  }): Promise<any> {
    try {
      console.log('Creando evento para el usuario:', userId);
      if (!this.tokens[userId]) {
        throw new Error('Usuario no autenticado con Google Calendar');
      }

      this.oauth2Client.setCredentials(this.tokens[userId]);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary: eventDetails.title,
        description: eventDetails.description,
        start: {
          dateTime: eventDetails.startTime.toISOString(),
          timeZone: 'America/Mexico_City',
        },
        end: {
          dateTime: eventDetails.endTime.toISOString(),
          timeZone: 'America/Mexico_City',
        },
        location: eventDetails.location,
      };

      console.log('Enviando solicitud para crear evento:', event);
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      console.log('Evento creado exitosamente');

      return response.data;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error al crear evento:', errorMessage);
      throw new Error('Error al crear evento: ' + errorMessage);
    }
  }
}

export default GoogleCalendarService; 