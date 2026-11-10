import express, { type Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Database } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import rankTierRoutes from './routes/rankTierRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { ErrorMiddleware } from './middlewares/errorMiddleware.js';
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
Database.connect();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Admin Routes (all grouped under /api/admin/* and protected by AuthMiddleware)
app.use('/api/admin', adminRoutes);

// Public & Client API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/rank-tiers', rankTierRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);

// 404 and Global Error Handling
app.use(ErrorMiddleware.notFoundHandler);
app.use(ErrorMiddleware.errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`[Server] Server is running on port ${PORT}`);
});

export default app;
