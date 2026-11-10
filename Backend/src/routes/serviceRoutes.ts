import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController.js';

const router = Router();

// Public routes for Services
router.get('/', ServiceController.getServices);
router.get('/:id', ServiceController.getServiceById);
router.get('/:id/options', ServiceController.getServiceCustomOptions);

export default router;
