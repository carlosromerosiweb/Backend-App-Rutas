/**
 * Rutas para la gestión de leads/clientes potenciales
 */
import { Router } from 'express';
import { authenticate, checkPermission } from '../middlewares/auth';
import { Resource, Action } from '../config/permissions';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  updateLeadStatus,
  assignLead,
  createLeadInteraction,
  getLeadInteractions
} from '../controllers/leads';

const router = Router();

/**
 * @route POST /api/leads
 * @desc Crea un nuevo lead
 * @access Privado (requiere autenticación)
 */
router.post(
  '/',
  authenticate,
  checkPermission(Resource.LEADS, Action.CREATE),
  createLead
);

/**
 * @route GET /api/leads
 * @desc Obtiene la lista de leads con filtros opcionales
 * @access Privado (requiere autenticación)
 */
router.get(
  '/',
  authenticate,
  checkPermission(Resource.LEADS, Action.READ),
  getLeads
);

/**
 * @route GET /api/leads/:id
 * @desc Obtiene un lead por su ID
 * @access Privado (requiere autenticación)
 */
router.get(
  '/:id',
  authenticate,
  checkPermission(Resource.LEADS, Action.READ),
  getLeadById
);

/**
 * @route PUT /api/leads/:id
 * @desc Actualiza un lead existente
 * @access Privado (requiere autenticación)
 */
router.put(
  '/:id',
  authenticate,
  checkPermission(Resource.LEADS, Action.UPDATE),
  updateLead
);

/**
 * @route DELETE /api/leads/:id
 * @desc Elimina un lead
 * @access Privado (requiere autenticación, solo admin y manager)
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission(Resource.LEADS, Action.DELETE),
  deleteLead
);

/**
 * @route PATCH /api/leads/:id/status
 * @desc Actualiza el estado de un lead
 * @access Privado (requiere autenticación)
 */
router.patch(
  '/:id/status',
  authenticate,
  checkPermission(Resource.LEADS, Action.UPDATE),
  updateLeadStatus
);

/**
 * @route POST /api/leads/:id/assign
 * @desc Asigna un lead a un comercial
 * @access Privado (requiere autenticación, solo admin y manager)
 */
router.post(
  '/:id/assign',
  authenticate,
  checkPermission(Resource.LEADS, Action.ASSIGN),
  assignLead
);

/**
 * @route POST /api/leads/:id/interactions
 * @desc Crea una nueva interacción con un lead
 * @access Privado (requiere autenticación)
 */
router.post(
  '/:id/interactions',
  authenticate,
  checkPermission(Resource.LEADS, Action.UPDATE),
  createLeadInteraction
);

/**
 * @route GET /api/leads/:id/interactions
 * @desc Obtiene las interacciones de un lead
 * @access Privado (requiere autenticación)
 */
router.get(
  '/:id/interactions',
  authenticate,
  checkPermission(Resource.LEADS, Action.READ),
  getLeadInteractions
);

export default router;