import { Router } from 'express';
import { GameController } from '../controllers/gameController.js';

const router = Router();

// Public routes for Games
router.get('/', GameController.getGames);
router.get('/:slug', GameController.getGameBySlug);

export default router;
