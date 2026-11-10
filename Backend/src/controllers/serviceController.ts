import type { Request, Response, NextFunction } from 'express';
import { Service, DEFAULT_CUSTOM_OPTIONS } from '../models/Service.js';
import { Game } from '../models/Game.js';
import { CloudinaryService } from '../config/cloudinary.js';
import type { CreateServiceRequestBody, UpdateServiceRequestBody } from '../types/index.js';

const parseBoolean = (val: unknown, defaultVal = true): boolean => {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val.trim().toLowerCase() === 'true';
  return Boolean(val);
};

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

      const parsedCustomOptions =
        typeof customOptions === 'string'
          ? JSON.parse(customOptions)
          : customOptions || DEFAULT_CUSTOM_OPTIONS;

      const service = await Service.create({
        gameId,
        name: name.trim(),
        description: description ? description.trim() : '',
        thumbnail,
        customOptions: parsedCustomOptions,
        isActive: parseBoolean(isActive, true)
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

      if (req.file) {
        thumbnail = await CloudinaryService.uploadToCloudinary(req.file.buffer, 'services');
        service.thumbnail = thumbnail;
      } else if (thumbnail) {
        service.thumbnail = thumbnail;
      }

      if (name) {
        service.name = name.trim();
      }

      if (description !== undefined) {
        service.description = description.trim();
      }

      if (customOptions) {
        const parsedCustomOptions =
          typeof customOptions === 'string' ? JSON.parse(customOptions) : customOptions;
        service.customOptions = parsedCustomOptions;
      }

      if (isActive !== undefined) {
        service.isActive = parseBoolean(isActive, service.isActive);
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
