import type { Request, Response, NextFunction } from 'express';
import { Game } from '../models/Game.js';
import { Service } from '../models/Service.js';
import { CloudinaryService } from '../config/cloudinary.js';
import type { CreateGameRequestBody, UpdateGameRequestBody } from '../types/index.js';

export class GameController {
  private static generateSlug(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  public static async getGames(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filter = req.query.all === 'true' ? {} : { isActive: true };
      const games = await Game.find(filter).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: games.length,
        games
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getGameBySlug(
    req: Request<{ slug: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { slug } = req.params;
      const game = await Game.findOne({ slug: slug.toLowerCase() });

      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin game'
        });
        return;
      }

      const services = await Service.find({ gameId: game._id, isActive: true });

      res.status(200).json({
        success: true,
        game,
        services
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createGame(
    req: Request<Record<string, never>, unknown, CreateGameRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, description, isActive } = req.body;
      let { slug, thumbnail } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          message: 'Tên game không được để trống'
        });
        return;
      }

      slug = slug ? GameController.generateSlug(slug) : GameController.generateSlug(name);

      if (req.file) {
        thumbnail = await CloudinaryService.uploadToCloudinary(req.file.buffer, 'games');
      }

      if (!thumbnail) {
        res.status(400).json({
          success: false,
          message: 'Ảnh đại diện game (thumbnail) là bắt buộc'
        });
        return;
      }

      const existingGame = await Game.findOne({
        $or: [{ name: name.trim() }, { slug }]
      });

      if (existingGame) {
        res.status(400).json({
          success: false,
          message: 'Tên game hoặc slug đã tồn tại'
        });
        return;
      }

      const game = await Game.create({
        name: name.trim(),
        slug,
        thumbnail,
        description: description ? description.trim() : '',
        isActive: isActive !== undefined ? Boolean(isActive) : true
      });

      res.status(201).json({
        success: true,
        message: 'Tạo game thành công',
        game
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateGame(
    req: Request<{ id: string }, unknown, UpdateGameRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      let { slug, thumbnail } = req.body;

      const game = await Game.findById(id);
      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy game'
        });
        return;
      }

      if (name) {
        game.name = name.trim();
      }

      if (slug) {
        game.slug = GameController.generateSlug(slug);
      } else if (name && !slug) {
        game.slug = GameController.generateSlug(name);
      }

      if (req.file) {
        thumbnail = await CloudinaryService.uploadToCloudinary(req.file.buffer, 'games');
        game.thumbnail = thumbnail;
      } else if (thumbnail) {
        game.thumbnail = thumbnail;
      }

      if (description !== undefined) {
        game.description = description.trim();
      }

      if (isActive !== undefined) {
        game.isActive = Boolean(isActive);
      }

      await game.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật game thành công',
        game
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteGame(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const permanent = req.query.permanent === 'true';

      const game = await Game.findById(id);
      if (!game) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy game'
        });
        return;
      }

      if (permanent) {
        await Game.findByIdAndDelete(id);
        res.status(200).json({
          success: true,
          message: 'Đã xóa hoàn toàn game khỏi hệ thống'
        });
      } else {
        game.isActive = false;
        await game.save();
        res.status(200).json({
          success: true,
          message: 'Đã khóa game (xóa mềm) thành công'
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

export default GameController;
