import type { Types } from 'mongoose';
import type { IGame } from '../models/Game.js';
import type { IRankTier } from '../models/RankTier.js';
import type { IService, ICustomOption } from '../models/Service.js';
import type { IOrder, IAccountInfo } from '../models/Order.js';
import type { IUser, UserRole } from '../models/User.js';
import type { IReview } from '../models/Review.js';

export type {
  IGame,
  IRankTier,
  IService,
  ICustomOption,
  IOrder,
  IAccountInfo,
  IUser,
  IReview,
  UserRole
};

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'canceled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type PaymentMethod = 'VIETQR' | 'MOCK_CARD';

export interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface CreateGameRequestBody {
  name: string;
  slug?: string;
  thumbnail?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateGameRequestBody {
  name?: string;
  slug?: string;
  thumbnail?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateRankTierRequestBody {
  gameId: string;
  name: string;
  index: number;
  costToNext: number;
}

export interface UpdateRankTierRequestBody {
  name?: string;
  index?: number;
  costToNext?: number;
}

export interface CreateServiceRequestBody {
  gameId: string;
  name: string;
  description?: string;
  thumbnail?: string;
  customOptions?: Array<{
    key: string;
    name: string;
    percentage: number;
    requiresInput?: boolean;
    inputPlaceholder?: string;
    description?: string;
    isActive?: boolean;
  }> | string;
  isActive?: boolean;
}

export interface UpdateServiceRequestBody {
  name?: string;
  description?: string;
  thumbnail?: string;
  customOptions?: Array<{
    key: string;
    name: string;
    percentage: number;
    requiresInput?: boolean;
    inputPlaceholder?: string;
    description?: string;
    isActive?: boolean;
  }> | string;
  isActive?: boolean;
}

export interface SelectedCustomOption {
  key: string;
  name?: string;
  percentage?: number;
  inputValue?: string;
}

export interface CalculatePriceRequestBody {
  serviceId: string;
  startRankTierId: string;
  targetRankTierId: string;
  customOptions?: SelectedCustomOption[];
}

export interface CalculatePriceResult {
  basePrice: number;
  multiplier: number;
  totalPrice: number;
  appliedOptions?: Array<{
    key: string;
    name: string;
    percentage: number;
    inputValue?: string;
  }>;
}

export interface CreateOrderRequestBody {
  serviceId: string;
  startRankTierId: string;
  targetRankTierId: string;
  customOptions?: SelectedCustomOption[];
  accountInfo: {
    inGameAccount: string;
    inGamePassword: string;
    inGameServer?: string;
    inGameName?: string;
    contactPhone?: string;
    note?: string;
  };
  paymentMethod?: 'VIETQR' | 'MOCK_CARD';
}

export interface RefundInfoRequestBody {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface UpdateOrderStatusRequestBody {
  orderStatus: 'pending' | 'in_progress' | 'completed' | 'canceled';
  proofImage?: string;
  cancelReason?: string;
}

export interface ConfirmRefundRequestBody {
  refundProof?: string;
}

export interface CreateReviewRequestBody {
  orderId: string;
  serviceId: string;
  rating: number;
  comment: string;
}

export interface AuthJwtPayload {
  id: string;
  role: 'client' | 'admin';
}
