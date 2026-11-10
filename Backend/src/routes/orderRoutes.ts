import { Router } from 'express';
import { OrderController } from '../controllers/orderController.js';
import { AuthMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Public price preview calculation
router.post('/calculate', OrderController.calculateOrderPrice);

// Client order endpoints (Protected)
router.post('/', AuthMiddleware.verifyToken, OrderController.createOrder);
router.get('/my-orders', AuthMiddleware.verifyToken, OrderController.getMyOrders);
router.get('/:id', AuthMiddleware.verifyToken, OrderController.getOrderById);
router.patch('/:id/refund-info', AuthMiddleware.verifyToken, OrderController.updateRefundInfo);

export default router;
