import { Router } from 'express';
import googleCalendarController from '../controllers/googleCalendar.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Ruta para iniciar el proceso de autenticación con Google
router.get('/auth', authenticate, googleCalendarController.initiateAuth);

// Ruta para manejar el callback de Google OAuth
router.get('/callback', authenticate, googleCalendarController.handleCallback);

// Ruta para crear eventos en Google Calendar
router.post('/events', authenticate, googleCalendarController.createEvent);

export default router; 