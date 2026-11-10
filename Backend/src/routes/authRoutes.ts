import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { AuthMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', AuthMiddleware.verifyToken, AuthController.getMe);

export default router;
