import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import { AuthMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Public reviews listing
router.get('/', ReviewController.getReviews);

// Client submit review for completed order
router.post('/', AuthMiddleware.verifyToken, ReviewController.createReview);

export default router;
