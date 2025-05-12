import { Request, Response } from 'express';
import GoogleCalendarService from '../services/googleCalendar.service';
import { JwtPayload } from '../types';

// Creamos una única instancia del servicio
const googleCalendarService = GoogleCalendarService.getInstance();

class GoogleCalendarController {
  public async initiateAuth(req: Request, res: Response): Promise<void> {
    try {
      console.log('Iniciando autenticación con Google Calendar...');
      console.log('Estado del servicio:', !!googleCalendarService);
      
      const authUrl = googleCalendarService.getAuthUrl();
      console.log('URL de autenticación generada:', authUrl);
      
      res.status(302).redirect(authUrl);
    } catch (error: any) {
      console.error('Error detallado en initiateAuth:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar la autenticación con Google',
        error: error.message
      });
    }
  }

  public async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      const userId = (req.user as JwtPayload)?.userId;

      if (!code || !userId) {
        throw new Error('Código de autorización o ID de usuario no proporcionado');
      }

      const tokens = await googleCalendarService.getTokens(code as string);
      googleCalendarService.setTokens(userId, tokens);

      res.json({
        success: true,
        message: 'Autenticación con Google Calendar completada exitosamente'
      });
    } catch (error: any) {
      console.error('Error en handleCallback:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el callback de Google',
        error: error.message
      });
    }
  }

  public async createEvent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as JwtPayload)?.userId;
      const { title, description, startTime, endTime, location } = req.body;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const event = await googleCalendarService.createEvent(userId, {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location
      });

      res.json({
        success: true,
        message: 'Evento creado exitosamente',
        data: event
      });
    } catch (error: any) {
      console.error('Error en createEvent:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear el evento',
        error: error.message
      });
    }
  }
}

// Exportamos una instancia del controlador
export default new GoogleCalendarController(); 