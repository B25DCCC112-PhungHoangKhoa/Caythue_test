import { RankTier } from '../models/RankTier.js';
import { Service, DEFAULT_CUSTOM_OPTIONS } from '../models/Service.js';
import type { IOrderOptions, CalculatePriceResult, SelectedCustomOption } from '../types/index.js';

export interface PriceCalculationParams {
  serviceId: string;
  startRankTierId?: string;
  targetRankTierId?: string;
  currentUnit?: number;
  targetUnit?: number;
  quantity?: number;
  options?: Partial<IOrderOptions>;
  customOptions?: SelectedCustomOption[];
}

export class PriceCalculator {
  public static async calculate({
    serviceId,
    startRankTierId,
    targetRankTierId,
    currentUnit,
    targetUnit,
    quantity,
    options,
    customOptions
  }: PriceCalculationParams): Promise<CalculatePriceResult> {
    // 1. Fetch Service
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Không tìm thấy gói dịch vụ tương ứng');
    }

    const serviceType = service.serviceType || 'RANK_TIER';
    let basePrice = 0;
    let unitsDiff: number | undefined = undefined;
    const unitLabel: string = service.priceConfig?.unitLabel || 'sao';

    // 2. Branch by serviceType Strategy
    switch (serviceType) {
      case 'RANK_TIER': {
        if (!startRankTierId || !targetRankTierId) {
          throw new Error('Vui lòng chọn bậc rank hiện tại và bậc rank mong muốn');
        }

        const [startTier, targetTier] = await Promise.all([
          RankTier.findById(startRankTierId),
          RankTier.findById(targetRankTierId)
        ]);

        if (!startTier || !targetTier) {
          throw new Error('Bậc rank nguồn hoặc rank đích không tồn tại');
        }

        const serviceGameId = service.gameId.toString();
        if (startTier.gameId.toString() !== serviceGameId || targetTier.gameId.toString() !== serviceGameId) {
          throw new Error('Bậc rank đã chọn không khớp với tựa game của dịch vụ');
        }

        if (targetTier.index <= startTier.index) {
          throw new Error('Bậc rank đích phải cao hơn bậc rank hiện tại');
        }

        const intermediateTiers = await RankTier.find({
          gameId: service.gameId,
          index: { $gte: startTier.index, $lt: targetTier.index }
        }).sort({ index: 1 });

        if (intermediateTiers.length === 0) {
          throw new Error('Không tìm thấy chặng bậc rank hợp lệ');
        }

        basePrice = intermediateTiers.reduce((sum, tier) => sum + tier.costToNext, 0);
        break;
      }

      case 'PER_UNIT': {
        if (currentUnit === undefined || currentUnit === null || targetUnit === undefined || targetUnit === null) {
          throw new Error(`Vui lòng nhập số ${unitLabel} hiện tại và mong muốn`);
        }

        const cur = Number(currentUnit);
        const tgt = Number(targetUnit);

        if (isNaN(cur) || isNaN(tgt)) {
          throw new Error(`Số ${unitLabel} phải là số hợp lệ`);
        }

        if (tgt <= cur) {
          throw new Error(`Số ${unitLabel} mong muốn phải lớn hơn số ${unitLabel} hiện tại`);
        }

        const minU = service.priceConfig?.minUnit;
        if (minU !== undefined && cur < minU) {
          throw new Error(`Số ${unitLabel} hiện tại không được nhỏ hơn ${minU}`);
        }

        const maxU = service.priceConfig?.maxUnit;
        if (maxU !== undefined && tgt > maxU) {
          throw new Error(`Số ${unitLabel} mong muốn không được vượt quá ${maxU}`);
        }

        unitsDiff = tgt - cur;
        const unitPrice = service.priceConfig?.unitPrice || 0;
        if (unitPrice <= 0) {
          throw new Error('Dịch vụ này chưa được thiết lập đơn giá hợp lệ');
        }

        basePrice = unitsDiff * unitPrice;
        break;
      }

      case 'MATCH_COUNT': {
        const qty = quantity !== undefined && quantity !== null ? Number(quantity) : 1;
        if (isNaN(qty) || qty < 1) {
          throw new Error(`Số lượng ${unitLabel} cần cày phải từ 1 trở lên`);
        }

        const maxU = service.priceConfig?.maxUnit;
        if (maxU !== undefined && qty > maxU) {
          throw new Error(`Số lượng ${unitLabel} tối đa là ${maxU}`);
        }

        const unitPrice = service.priceConfig?.unitPrice || 0;
        if (unitPrice <= 0) {
          throw new Error('Dịch vụ này chưa được thiết lập đơn giá hợp lệ');
        }

        unitsDiff = qty;
        basePrice = qty * unitPrice;
        break;
      }

      case 'FIXED_PACKAGE': {
        const fixedPrice = service.priceConfig?.fixedPrice || 0;
        if (fixedPrice <= 0) {
          throw new Error('Gói dịch vụ này chưa được thiết lập giá cố định');
        }
        basePrice = fixedPrice;
        break;
      }

      default: {
        throw new Error(`Loại dịch vụ ${serviceType} không được hỗ trợ`);
      }
    }

    // 4. Calculate multiplier
    let multiplier = 1.0;
    const appliedOptions: Array<{
      key: string;
      name: string;
      percentage: number;
      inputValue?: string;
    }> = [];

    // Support dynamic customOptions ("Tùy chọn mở rộng")
    const availableOptions =
      service.customOptions && service.customOptions.length > 0
        ? service.customOptions
        : DEFAULT_CUSTOM_OPTIONS;

    if (customOptions && Array.isArray(customOptions) && customOptions.length > 0) {
      for (const item of customOptions) {
        const found = availableOptions.find((opt) => opt.key === item.key && opt.isActive);
        if (found) {
          if (found.percentage > 0) {
            multiplier += found.percentage / 100;
          }
          appliedOptions.push({
            key: found.key,
            name: found.name,
            percentage: found.percentage,
            inputValue: item.inputValue || ''
          });
        }
      }
    } else {
      // Fallback for legacy options
      const sMultipliers = service.multipliers || { express: 1.25, pickRole: 1.15, duo: 1.5 };
      if (options?.isExpress) {
        multiplier += (sMultipliers.express ?? 1.25) - 1.0;
        appliedOptions.push({ key: 'express', name: 'Cày siêu tốc', percentage: Math.round(((sMultipliers.express ?? 1.25) - 1.0) * 100) });
      }
      if (options?.pickRole) {
        multiplier += (sMultipliers.pickRole ?? 1.15) - 1.0;
        appliedOptions.push({ key: 'pickRole', name: 'Chỉ định vị trí/tướng', percentage: Math.round(((sMultipliers.pickRole ?? 1.15) - 1.0) * 100) });
      }
      if (options?.isDuo) {
        multiplier += (sMultipliers.duo ?? 1.5) - 1.0;
        appliedOptions.push({ key: 'duo', name: 'Duo cùng booster', percentage: Math.round(((sMultipliers.duo ?? 1.5) - 1.0) * 100) });
      }
    }

    multiplier = Math.round(multiplier * 100) / 100;
    const totalPrice = Math.round(basePrice * multiplier);

    return {
      basePrice,
      multiplier,
      totalPrice,
      serviceType,
      unitsDiff,
      unitLabel,
      appliedOptions
    };
  }
}

export default PriceCalculator;
