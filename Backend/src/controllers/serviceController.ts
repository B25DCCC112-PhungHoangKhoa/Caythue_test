import type { Request, Response, NextFunction } from 'express';
import { Service, DEFAULT_CUSTOM_OPTIONS } from '../models/Service.js';
import { Game } from '../models/Game.js';
import { CloudinaryService } from '../config/cloudinary.js';
import type { CreateServiceRequestBody, UpdateServiceRequestBody } from '../types/index.js';

export class ServiceController {
  public static async getServices(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, all } = req.query;

      const query: Record<string, unknown> = {};
      if (all !== 'true') {
        query.isActive = true;
      }
      if (gameId) {
        query.gameId = gameId;
      }

      const services = await Service.find(query).populate('gameId', 'name slug thumbnail');

      const mappedServices = services.map((s) => {
        const obj = s.toObject();
        if (!obj.customOptions || obj.customOptions.length === 0) {
          obj.customOptions = DEFAULT_CUSTOM_OPTIONS as any;
        }
        return obj;
      });

      res.status(200).json({
        success: true,
        count: mappedServices.length,
        services: mappedServices
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getServiceById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const service = await Service.findById(id).populate('gameId', 'name slug thumbnail');

      if (!service) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói dịch vụ'
        });
        return;
      }

      const obj = service.toObject();
      if (!obj.customOptions || obj.customOptions.length === 0) {
        obj.customOptions = DEFAULT_CUSTOM_OPTIONS as any;
      }

      res.status(200).json({
        success: true,
        service: obj
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getServiceCustomOptions(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const service = await Service.findById(id);

      if (!service) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói dịch vụ'
        });
        return;
      }

      const customOptions =
        service.customOptions && service.customOptions.length > 0
          ? service.customOptions
          : DEFAULT_CUSTOM_OPTIONS;

      res.status(200).json({
        success: true,
        customOptions
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateServiceCustomOptions(
    req: Request<{ id: string }, unknown, { customOptions: unknown[] }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { customOptions } = req.body;

      if (!Array.isArray(customOptions)) {
        res.status(400).json({
          success: false,
          message: 'Danh sách tùy chọn mở rộng (customOptions) phải là một mảng'
        });
        return;
      }

      const service = await Service.findById(id);
      if (!service) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói dịch vụ'
        });
        return;
      }

      service.customOptions = customOptions as any;
      await service.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật tùy chọn mở rộng thành công',
        customOptions: service.customOptions
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createService(
    req: Request<Record<string, never>, unknown, CreateServiceRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        gameId,
        name,
        description,
        serviceType,
        priceConfig,
        multipliers,
        customOptions,
        isActive
      } = req.body;
      let { thumbnail } = req.body;

      if (!gameId || !name) {
        res.status(400).json({
          success: false,
          message: 'gameId và tên dịch vụ là bắt buộc'
        });
        return;
      }

      const game = await Game.findById(gameId);
      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy tựa game chỉ định'
        });
        return;
      }

      if (req.file) {
        thumbnail = await CloudinaryService.uploadToCloudinary(req.file.buffer, 'services');
      }

      if (!thumbnail) {
        res.status(400).json({
          success: false,
          message: 'Ảnh đại diện dịch vụ (thumbnail) là bắt buộc'
        });
        return;
      }

      const parsedMultipliers =
        typeof multipliers === 'string' ? JSON.parse(multipliers) : multipliers;

      const parsedCustomOptions =
        typeof customOptions === 'string'
          ? JSON.parse(customOptions)
          : customOptions || DEFAULT_CUSTOM_OPTIONS;

      let parsedPriceConfig = {
        unitPrice: 0,
        unitLabel: 'sao',
        minUnit: 1,
        maxUnit: 100,
        fixedPrice: 0
      };

      if (priceConfig) {
        const rawConfig = typeof priceConfig === 'string' ? JSON.parse(priceConfig) : priceConfig;
        parsedPriceConfig = {
          unitPrice: Number(rawConfig.unitPrice) || 0,
          unitLabel: rawConfig.unitLabel ? String(rawConfig.unitLabel).trim() : 'sao',
          minUnit: Number(rawConfig.minUnit) || 1,
          maxUnit: Number(rawConfig.maxUnit) || 100,
          fixedPrice: Number(rawConfig.fixedPrice) || 0
        };
      }

      const service = await Service.create({
        gameId,
        name: name.trim(),
        description: description ? description.trim() : '',
        thumbnail,
        serviceType: serviceType || 'RANK_TIER',
        priceConfig: parsedPriceConfig,
        multipliers: {
          express: parsedMultipliers?.express ?? 1.25,
          pickRole: parsedMultipliers?.pickRole ?? 1.15,
          duo: parsedMultipliers?.duo ?? 1.5
        },
        customOptions: parsedCustomOptions,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      });

      res.status(201).json({
        success: true,
        message: 'Tạo gói dịch vụ thành công',
        service
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateService(
    req: Request<{ id: string }, unknown, UpdateServiceRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        serviceType,
        priceConfig,
        multipliers,
        customOptions,
        isActive
      } = req.body;
      let { thumbnail } = req.body;

      const service = await Service.findById(id);
      if (!service) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói dịch vụ'
        });
        return;
      }

      if (name) {
        service.name = name.trim();
      }

      if (description !== undefined) {
        service.description = description.trim();
      }

      if (serviceType) {
        service.serviceType = serviceType;
      }

      if (priceConfig) {
        const rawConfig = typeof priceConfig === 'string' ? JSON.parse(priceConfig) : priceConfig;
        service.priceConfig = {
          unitPrice: rawConfig.unitPrice !== undefined ? Number(rawConfig.unitPrice) : (service.priceConfig?.unitPrice || 0),
          unitLabel: rawConfig.unitLabel !== undefined ? String(rawConfig.unitLabel).trim() : (service.priceConfig?.unitLabel || 'sao'),
          minUnit: rawConfig.minUnit !== undefined ? Number(rawConfig.minUnit) : (service.priceConfig?.minUnit || 1),
          maxUnit: rawConfig.maxUnit !== undefined ? Number(rawConfig.maxUnit) : (service.priceConfig?.maxUnit || 100),
          fixedPrice: rawConfig.fixedPrice !== undefined ? Number(rawConfig.fixedPrice) : (service.priceConfig?.fixedPrice || 0)
        } as any;
      }

      if (req.file) {
        thumbnail = await CloudinaryService.uploadToCloudinary(req.file.buffer, 'services');
        service.thumbnail = thumbnail;
      } else if (thumbnail) {
        service.thumbnail = thumbnail;
      }

      if (multipliers) {
        const parsedMultipliers =
          typeof multipliers === 'string' ? JSON.parse(multipliers) : multipliers;

        const currentMultipliers = service.multipliers || {
          express: 1.25,
          pickRole: 1.15,
          duo: 1.5
        };
        service.multipliers = {
          express: parsedMultipliers.express ?? currentMultipliers.express,
          pickRole: parsedMultipliers.pickRole ?? currentMultipliers.pickRole,
          duo: parsedMultipliers.duo ?? currentMultipliers.duo
        };
      }

      if (customOptions) {
        const parsedCustomOptions =
          typeof customOptions === 'string' ? JSON.parse(customOptions) : customOptions;
        service.customOptions = parsedCustomOptions;
      }

      if (isActive !== undefined) {
        service.isActive = Boolean(isActive);
      }

      await service.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật dịch vụ thành công',
        service
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteService(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const service = await Service.findByIdAndDelete(id);
      if (!service) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ cần xóa'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Xóa dịch vụ thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ServiceController;
