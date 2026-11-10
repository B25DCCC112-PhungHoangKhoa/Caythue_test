import { Router } from 'express';
import { AuthMiddleware } from '../middlewares/authMiddleware.js';
import { UploadMiddleware } from '../middlewares/uploadMiddleware.js';
import { GameController } from '../controllers/gameController.js';
import { RankTierController } from '../controllers/rankTierController.js';
import { ServiceController } from '../controllers/serviceController.js';
import { OrderController } from '../controllers/orderController.js';
import { ReviewController } from '../controllers/reviewController.js';

const router = Router();

// Apply Authentication & Admin Authorization to all /api/admin routes
router.use(AuthMiddleware.verifyToken, AuthMiddleware.isAdmin);

// ==========================================
// ADMIN: GAMES MANAGEMENT (/api/admin/games)
// ==========================================
router.post('/games', UploadMiddleware.single('thumbnail'), GameController.createGame);
router.put('/games/:id', UploadMiddleware.single('thumbnail'), GameController.updateGame);
router.delete('/games/:id', GameController.deleteGame);

// ==========================================
// ADMIN: RANK TIERS MANAGEMENT (/api/admin/rank-tiers)
// ==========================================
router.post('/rank-tiers', RankTierController.createRankTier);
router.put('/rank-tiers/:id', RankTierController.updateRankTier);
router.delete('/rank-tiers/:id', RankTierController.deleteRankTier);

// ==========================================
// ADMIN: SERVICES MANAGEMENT (/api/admin/services)
// ==========================================
router.post('/services', UploadMiddleware.single('thumbnail'), ServiceController.createService);
router.put('/services/:id', UploadMiddleware.single('thumbnail'), ServiceController.updateService);
router.delete('/services/:id', ServiceController.deleteService);
router.get('/services/:id/options', ServiceController.getServiceCustomOptions);
router.put('/services/:id/options', ServiceController.updateServiceCustomOptions);

// ==========================================
// ADMIN: ORDERS MANAGEMENT (/api/admin/orders)
// ==========================================
router.get('/orders', OrderController.getAllOrders);
router.get('/orders/:id', OrderController.getOrderById);
router.patch('/orders/:id/status', UploadMiddleware.single('proofImage'), OrderController.updateOrderStatus);
router.patch('/orders/:id/confirm-refund', UploadMiddleware.single('refundProof'), OrderController.confirmRefund);

// ==========================================
// ADMIN: REVIEWS MANAGEMENT (/api/admin/reviews)
// ==========================================
router.delete('/reviews/:id', ReviewController.deleteReview);

export default router;

