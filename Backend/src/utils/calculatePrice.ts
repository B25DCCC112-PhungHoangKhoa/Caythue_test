import { RankTier } from '../models/RankTier.js';
import { Service, DEFAULT_CUSTOM_OPTIONS } from '../models/Service.js';
import type { CalculatePriceResult, SelectedCustomOption } from '../types/index.js';

export interface PriceCalculationParams {
  serviceId: string;
  startRankTierId: string;
  targetRankTierId: string;
  customOptions?: SelectedCustomOption[];
}

export class PriceCalculator {
  public static async calculate({
    serviceId,
    startRankTierId,
    targetRankTierId,
    customOptions
  }: PriceCalculationParams): Promise<CalculatePriceResult> {
    if (!startRankTierId || !targetRankTierId) {
      throw new Error('Vui lòng chọn bậc rank hiện tại và bậc rank mong muốn');
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Không tìm thấy gói dịch vụ tương ứng');
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

    const basePrice = intermediateTiers.reduce((sum, tier) => sum + tier.costToNext, 0);

    // Calculate options multiplier: Express (+35%), Pick Hero (+25%)
    let multiplier = 1.0;
    const appliedOptions: Array<{
      key: string;
      name: string;
      percentage: number;
      inputValue?: string;
    }> = [];

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
    }

    multiplier = Math.round(multiplier * 100) / 100;
    const totalPrice = Math.round(basePrice * multiplier);

    return {
      basePrice,
      multiplier,
      totalPrice,
      appliedOptions
    };
  }
}

export default PriceCalculator;
