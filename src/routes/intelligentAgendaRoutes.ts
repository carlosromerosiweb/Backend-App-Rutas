import { Router } from 'express';
import { IntelligentAgendaController } from '../controllers/intelligentAgendaController';
import { authenticate } from '../middlewares/auth';

const router = Router();
const intelligentAgendaController = new IntelligentAgendaController();

router.get(
  '/intelligent-agenda',
  authenticate,
  intelligentAgendaController.getIntelligentAgenda.bind(intelligentAgendaController)
);

export default router; 