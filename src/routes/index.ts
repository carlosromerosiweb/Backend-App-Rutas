import { Router } from 'express';
import authRoutes from './auth';
import notificationRoutes from './notifications';
import leadsRoutes from './leads';
import importRoutes from './import';
import checkinsRoutes from './checkin.routes';
import followupsRoutes from './followups.routes';
import reportRoutes from './reports.routes';
import geocodingRoutes from './geocoding.routes';
import placesImportRoutes from './placesImport.routes';
import googleCalendarRoutes from './googleCalendar.routes';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public routes
router.use('/', authRoutes);

// Protected routes
router.use('/leads', authenticate, leadsRoutes);
router.use('/import', importRoutes);
router.use('/leads/import', placesImportRoutes);
router.use('/checkins', authenticate, checkinsRoutes);
router.use('/followups', authenticate, followupsRoutes);
router.use('/reports', reportRoutes);
router.use('/geocode', geocodingRoutes);
router.use('/google', googleCalendarRoutes);

// Example of a protected route
router.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

export default router;
