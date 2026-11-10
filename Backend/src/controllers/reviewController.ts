import type { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import type { CreateReviewRequestBody } from '../types/index.js';

export class ReviewController {
  private static extractIdString(idOrObj: unknown): string {
    if (idOrObj && typeof idOrObj === 'object' && '_id' in idOrObj) {
      return String((idOrObj as { _id: unknown })._id);
    }
    return String(idOrObj);
  }

  public static async getReviews(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { serviceId } = req.query;

      const query: Record<string, unknown> = {};
      if (serviceId) {
        query.serviceId = serviceId;
      }

      const reviews = await Review.find(query)
        .populate('userId', 'name')
        .populate('serviceId', 'name thumbnail')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: reviews.length,
        reviews
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createReview(
    req: Request<Record<string, never>, unknown, CreateReviewRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Chưa đăng nhập'
        });
        return;
      }

      const { orderId, serviceId, rating, comment } = req.body;

      if (!orderId || !serviceId || rating === undefined || !comment) {
        res.status(400).json({
          success: false,
          message: 'orderId, serviceId, rating và comment là bắt buộc'
        });
        return;
      }

      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        res.status(400).json({
          success: false,
          message: 'Số sao đánh giá phải từ 1 đến 5 sao'
        });
        return;
      }

      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
        return;
      }

      if (ReviewController.extractIdString(order.userId) !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Bạn không có quyền đánh giá đơn hàng của người khác'
        });
        return;
      }

      if (order.orderStatus !== 'completed') {
        res.status(400).json({
          success: false,
          message: 'Chỉ có thể đánh giá đơn hàng khi đã hoàn tất (completed)'
        });
        return;
      }

      const existingReview = await Review.findOne({ orderId });
      if (existingReview) {
        res.status(400).json({
          success: false,
          message: 'Đơn hàng này đã được đánh giá trước đó'
        });
        return;
      }

      const review = await Review.create({
        userId: req.user.id,
        serviceId,
        orderId,
        rating: numRating,
        comment: comment.trim()
      });

      res.status(201).json({
        success: true,
        message: 'Gửi đánh giá thành công',
        review
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteReview(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const review = await Review.findByIdAndDelete(id);
      if (!review) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy đánh giá cần xóa'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Đã xóa đánh giá thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ReviewController;
