import { Router } from 'express';
import { RankTierController } from '../controllers/rankTierController.js';

const router = Router();

// Public route to get rank tiers of a game
router.get('/', RankTierController.getRankTiers);

export default router;
