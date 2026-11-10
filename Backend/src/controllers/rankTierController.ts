import type { Request, Response, NextFunction } from 'express';
import { RankTier } from '../models/RankTier.js';
import { Game } from '../models/Game.js';
import type { CreateRankTierRequestBody, UpdateRankTierRequestBody } from '../types/index.js';

export class RankTierController {
  public static async getRankTiers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId } = req.query;

      const query: Record<string, unknown> = {};
      if (gameId) {
        query.gameId = gameId;
      }

      const rankTiers = await RankTier.find(query).sort({ index: 1 });

      res.status(200).json({
        success: true,
        count: rankTiers.length,
        rankTiers
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createRankTier(
    req: Request<Record<string, never>, unknown, CreateRankTierRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, name, index, costToNext } = req.body;

      if (!gameId || !name || index === undefined || costToNext === undefined) {
        res.status(400).json({
          success: false,
          message: 'gameId, name, index và costToNext là bắt buộc'
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

      const existingTier = await RankTier.findOne({ gameId, index });
      if (existingTier) {
        res.status(400).json({
          success: false,
          message: `Chỉ số index ${index} đã tồn tại trong tựa game này`
        });
        return;
      }

      const rankTier = await RankTier.create({
        gameId,
        name: name.trim(),
        index: Number(index),
        costToNext: Number(costToNext)
      });

      res.status(201).json({
        success: true,
        message: 'Tạo bậc rank thành công',
        rankTier
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateRankTier(
    req: Request<{ id: string }, unknown, UpdateRankTierRequestBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { name, index, costToNext } = req.body;

      const rankTier = await RankTier.findById(id);
      if (!rankTier) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy bậc rank'
        });
        return;
      }

      if (name) {
        rankTier.name = name.trim();
      }

      if (index !== undefined && index !== rankTier.index) {
        const conflict = await RankTier.findOne({
          gameId: rankTier.gameId,
          index: Number(index),
          _id: { $ne: rankTier._id }
        });
        if (conflict) {
          res.status(400).json({
            success: false,
            message: `Chỉ số index ${index} đã tồn tại trong tựa game này`
          });
          return;
        }
        rankTier.index = Number(index);
      }

      if (costToNext !== undefined) {
        if (costToNext < 0) {
          res.status(400).json({
            success: false,
            message: 'Chi phí vượt bậc không được nhỏ hơn 0'
          });
          return;
        }
        rankTier.costToNext = Number(costToNext);
      }

      await rankTier.save();

      res.status(200).json({
        success: true,
        message: 'Cập nhật bậc rank thành công',
        rankTier
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteRankTier(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const rankTier = await RankTier.findByIdAndDelete(id);
      if (!rankTier) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy bậc rank cần xóa'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Xóa bậc rank thành công'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default RankTierController;
