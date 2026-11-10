import type { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order.js';
import { Service } from '../models/Service.js';
import { PriceCalculator } from '../utils/calculatePrice.js';
import { VietQRService } from '../utils/vietqr.js';
import { CloudinaryService } from '../config/cloudinary.js';
import type {
  CalculatePriceRequestBody,
  CreateOrderRequestBody,
  RefundInfoRequestBody,
  UpdateOrderStatusRequestBody,
  ConfirmRefundRequestBody,
  OrderStatus,
  PaymentStatus
} from '../types/index.js';

export class OrderController {
  private static extractIdString(idOrObj: unknown): string {
    if (idOrObj && typeof idOrObj === 'object' && '_id' in idOrObj) {
      return String((idOrObj as { _id: unknown })._id);
    }
    return String(idOrObj);
  }

  public static async calculateOrderPrice(
    req: Request<Record<string, never>, unknown, CalculatePriceRequestBody>,
    res: Response,
    _next: NextFunction
  ): Promise<void> {
    try {
      const {
        serviceId,
        startRankTierId,
        targetRankTierId,
        currentUnit,
        targetUnit,
        quantity,
        options,
        customOptions
      } = req.body;

      if (!serviceId) {
        res.status(400).json({
          success: false,
          message: 'serviceId là bắt buộc'
        });
        return;
      }

      const priceResult = await PriceCalculator.calculate({
        serviceId,
        startRankTierId,
        targetRankTierId,
        currentUnit,
        targetUnit,
        quantity,
        options,
        customOptions
      });

      res.status(200).json({
        success: true,
        basePrice: priceResult.basePrice,
        multiplier: priceResult.multiplier,
        totalPrice: priceResult.totalPrice,
        serviceType: priceResult.serviceType,
        unitsDiff: priceResult.unitsDiff,
        unitLabel: priceResult.unitLabel,
        appliedOptions: priceResult.appliedOptions
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message
      });
    }
  }

  public static async createOrder(
    req: Request<Record<string, never>, unknown, CreateOrderRequestBody>,
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

      const {
        serviceId,
        startRankTierId,
        targetRankTierId,
        currentUnit,
        targetUnit,
        quantity,
        options,
        customOptions,
        accountInfo,
        paymentMethod
      } = req.body;

      if (!serviceId) {
        res.status(400).json({
          success: false,
          message: 'serviceId là bắt buộc'
        });
        return;
      }

      if (
        !accountInfo ||
        !accountInfo.inGameAccount ||
        !accountInfo.inGamePassword
      ) {
        res.status(400).json({
          success: false,
          message: 'Tài khoản và mật khẩu game là bắt buộc'
        });
        return;
      }

      // Recalculate price strictly on backend
      const priceResult = await PriceCalculator.calculate({
        serviceId,
        startRankTierId,
        targetRankTierId,
        currentUnit,
        targetUnit,
        quantity,
        options,
        customOptions
      });

      const service = await Service.findById(serviceId);
      const serviceType = service?.serviceType || 'RANK_TIER';

      // Generate unique orderCode
      let orderCode = VietQRService.generateOrderCode();
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const existing = await Order.findOne({ orderCode });
        if (!existing) {
          isUnique = true;
        } else {
          orderCode = VietQRService.generateOrderCode();
          attempts++;
        }
      }

      // Generate random transferCode (e.g. d6yc33) and transferMessage (e.g. NAP d6yc33)
      const transferCode = VietQRService.generateTransferCode();
      const transferMessage = `NAP ${transferCode}`;
      const bankConfig = VietQRService.getBankConfig();

      const newOrder = await Order.create({
        orderCode,
        transferCode,
        userId: req.user.id,
        serviceId,
        serviceConfig: {
          serviceType,
          currentUnit: currentUnit !== undefined ? Number(currentUnit) : undefined,
          targetUnit: targetUnit !== undefined ? Number(targetUnit) : undefined,
          unitLabel: service?.priceConfig?.unitLabel || 'sao',
          quantity: quantity !== undefined ? Number(quantity) : undefined,
          packageName: service?.name || ''
        },
        startRankTierId: serviceType === 'RANK_TIER' ? startRankTierId : null,
        targetRankTierId: serviceType === 'RANK_TIER' ? targetRankTierId : null,
        options: {
          isExpress: Boolean(options?.isExpress),
          pickRole: Boolean(options?.pickRole),
          isDuo: Boolean(options?.isDuo)
        },
        customOptions: priceResult.appliedOptions || [],
        accountInfo: {
          inGameAccount: accountInfo.inGameAccount.trim(),
          inGamePassword: accountInfo.inGamePassword,
          inGameServer: accountInfo.inGameServer ? accountInfo.inGameServer.trim() : 'VN',
          inGameName: accountInfo.inGameName ? accountInfo.inGameName.trim() : '',
          contactPhone: accountInfo.contactPhone ? accountInfo.contactPhone.trim() : '',
          note: accountInfo.note ? accountInfo.note.trim() : ''
        },
        basePrice: priceResult.basePrice,
        totalPrice: priceResult.totalPrice,
        paymentMethod: paymentMethod || 'VIETQR',
        paymentStatus: 'pending',
        orderStatus: 'pending'
      });

      const qrUrl = VietQRService.generateVietQRUrl(transferMessage, newOrder.totalPrice);

      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công',
        order: {
          _id: newOrder._id.toString(),
          orderCode: newOrder.orderCode,
          transferCode,
          transferMessage,
          totalPrice: newOrder.totalPrice,
          paymentStatus: newOrder.paymentStatus,
          orderStatus: newOrder.orderStatus,
          qrUrl,
          bankInfo: {
            bankName: bankConfig.bankName,
            accountNumber: bankConfig.accountNo,
            accountHolder: bankConfig.accountName,
            branch: bankConfig.branch
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyOrders(
    req: Request,
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

      const orders = await Order.find({ userId: req.user.id })
        .populate('serviceId', 'name thumbnail multipliers')
        .populate('startRankTierId', 'name index costToNext')
        .populate('targetRankTierId', 'name index')
        .sort({ createdAt: -1 });

      const bankConfig = VietQRService.getBankConfig();
      const ordersWithQR = orders.map((order) => {
        const obj = order.toObject();
        const transferCode = order.transferCode || order.orderCode.toLowerCase();
        const transferMessage = `NAP ${transferCode}`;
        return {
          ...obj,
          transferCode,
          transferMessage,
          bankInfo: {
            bankName: bankConfig.bankName,
            accountNumber: bankConfig.accountNo,
            accountHolder: bankConfig.accountName,
            branch: bankConfig.branch
          },
          qrUrl: VietQRService.generateVietQRUrl(transferMessage, order.totalPrice)
        };
      });

      res.status(200).json({
        success: true,
        count: orders.length,
        orders: ordersWithQR
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getOrderById(
    req: Request<{ id: string }>,
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

      const { id } = req.params;
      const order = await Order.findById(id)
        .populate('userId', 'name email phoneNumber')
        .populate('serviceId', 'name thumbnail multipliers')
        .populate('startRankTierId', 'name index costToNext')
        .populate('targetRankTierId', 'name index');

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
        return;
      }

      const orderUserId = OrderController.extractIdString(order.userId);

      // Authorization: client can only view their own order
      if (req.user.role !== 'admin' && orderUserId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem thông tin đơn hàng này'
        });
        return;
      }

      const bankConfig = VietQRService.getBankConfig();
      const transferCode = order.transferCode || order.orderCode.toLowerCase();
      const transferMessage = `NAP ${transferCode}`;
      const qrUrl = VietQRService.generateVietQRUrl(transferMessage, order.totalPrice);

      res.status(200).json({
        success: true,
        order: {
          ...order.toObject(),
          transferCode,
          transferMessage,
          bankInfo: {
            bankName: bankConfig.bankName,
            accountNumber: bankConfig.accountNo,
            accountHolder: bankConfig.accountName,
            branch: bankConfig.branch
          },
          qrUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateRefundInfo(
    req: Request<{ id: string }, unknown, RefundInfoRequestBody>,
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

      const { id } = req.params;
      const { bankName, accountNumber, accountHolder } = req.body;

      if (!bankName || !accountNumber || !accountHolder) {
        res.status(400).json({
          success: false,
          message: 'Tên ngân hàng, số tài khoản và tên chủ tài khoản là bắt buộc'
        });
        return;
      }

      const order = await Order.findById(id);
      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
        return;
      }

      if (req.user.role !== 'admin' && OrderController.extractIdString(order.userId) !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Bạn không có quyền thao tác trên đơn hàng này'
        });
        return;
      }

      if (order.orderStatus !== 'canceled') {
        res.status(400).json({
          success: false,
          message: 'Chỉ có thể gửi thông tin hoàn tiền khi đơn hàng đã bị hủy'
        });
        return;
      }

      order.refundInfo = {
        ...order.refundInfo,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase()
      };

      await order.save();

      res.status(200).json({
        success: true,
        message: 'Gửi thông tin hoàn tiền thành công',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAllOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { status, paymentStatus, page, limit } = req.query;

      const query: Record<string, unknown> = {};
      if (status) {
        query.orderStatus = status;
      }
      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }

      const pageNumber = Math.max(1, parseInt((page as string) || '1', 10));
      const pageSize = Math.max(1, parseInt((limit as string) || '10', 10));
      const skip = (pageNumber - 1) * pageSize;

      const [total, orders] = await Promise.all([
        Order.countDocuments(query),
        Order.find(query)
          .populate('userId', 'name email phoneNumber')
          .populate('serviceId', 'name thumbnail')
          .populate('startRankTierId', 'name index')
          .populate('targetRankTierId', 'name index')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
      ]);

      const bankConfig = VietQRService.getBankConfig();
      const ordersWithQR = orders.map((order) => {
        const obj = order.toObject();
        const transferCode = order.transferCode || order.orderCode.toLowerCase();
        const transferMessage = `NAP ${transferCode}`;
        return {
          ...obj,
          transferCode,
          transferMessage,
          bankInfo: {
            bankName: bankConfig.bankName,
            accountNumber: bankConfig.accountNo,
            accountHolder: bankConfig.accountName,
            branch: bankConfig.branch
          },
          qrUrl: VietQRService.generateVietQRUrl(transferMessage, order.totalPrice)
        };
      });

      res.status(200).json({
        success: true,
        count: orders.length,
        total,
        page: pageNumber,
        totalPages: Math.ceil(total / pageSize),
        orders: ordersWithQR
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateOrderStatus(
    req: Request<{ id: string }, unknown, UpdateOrderStatusRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { orderStatus, cancelReason } = req.body;
      let { proofImage } = req.body;

      const validStatuses: OrderStatus[] = ['pending', 'in_progress', 'completed', 'canceled'];
      if (!orderStatus || !validStatuses.includes(orderStatus)) {
        res.status(400).json({
          success: false,
          message: 'Trạng thái đơn hàng không hợp lệ (pending, in_progress, completed, canceled)'
        });
        return;
      }

      const order = await Order.findById(id);
      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
        return;
      }

      if (req.file) {
        proofImage = await CloudinaryService.uploadToCloudinary(req.file.buffer, 'proofs');
      }

      order.orderStatus = orderStatus;

      if (orderStatus === 'completed') {
        if (proofImage) {
          order.proofImage = proofImage;
        }
        if (order.paymentStatus === 'pending') {
          order.paymentStatus = 'paid';
        }
      }

      if (orderStatus === 'canceled' && cancelReason) {
        order.cancelReason = cancelReason.trim();
      }

      await order.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái đơn hàng thành công',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  public static async confirmRefund(
    req: Request<{ id: string }, unknown, ConfirmRefundRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      let { refundProof } = req.body;

      const order = await Order.findById(id);
      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
        return;
      }

      if (req.file) {
        refundProof = await CloudinaryService.uploadToCloudinary(req.file.buffer, 'refunds');
      }

      order.paymentStatus = 'refunded' as PaymentStatus;
      order.refundInfo = {
        ...order.refundInfo,
        refundProof: refundProof || order.refundInfo?.refundProof || null,
        refundedAt: new Date()
      };

      await order.save();

      res.status(200).json({
        success: true,
        message: 'Xác nhận hoàn tiền cho khách thành công',
        order
      });
    } catch (error) {
      next(error);
    }
  }
}

export default OrderController;
