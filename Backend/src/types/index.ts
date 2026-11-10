// =====================================================================
// INFERRED TYPES FROM MONGOOSE SCHEMAS (Single Source of Truth)
// =====================================================================
export type { IUser, UserRole, UserSchemaType } from '../models/User.js';
export type { IGame, GameSchemaType } from '../models/Game.js';
export type { IRankTier, RankTierSchemaType } from '../models/RankTier.js';
export type {
  IService,
  IServiceMultipliers,
  ServiceSchemaType,
  ICustomOption,
  CustomOptionSchemaType,
  ServiceType,
  IPriceConfig,
  PriceConfigSchemaType
} from '../models/Service.js';
export type {
  IOrder,
  IServiceConfig,
  IOrderOptions,
  IAccountInfo,
  IRefundInfo,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  OrderSchemaType
} from '../models/Order.js';
export type { IReview, ReviewSchemaType } from '../models/Review.js';

export type RefundStatus = 'none' | 'pending' | 'refunded';

// =====================================================================
// API REQUEST BODY & PAYLOAD INTERFACES (DTOs)
// =====================================================================

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

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'admin';
  phoneNumber?: string | null;
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
  serviceType?: 'RANK_TIER' | 'PER_UNIT' | 'MATCH_COUNT' | 'FIXED_PACKAGE';
  priceConfig?: {
    unitPrice?: number;
    unitLabel?: string;
    minUnit?: number;
    maxUnit?: number;
    fixedPrice?: number;
  } | string;
  multipliers?: {
    express?: number;
    pickRole?: number;
    duo?: number;
  } | string;
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
  serviceType?: 'RANK_TIER' | 'PER_UNIT' | 'MATCH_COUNT' | 'FIXED_PACKAGE';
  priceConfig?: {
    unitPrice?: number;
    unitLabel?: string;
    minUnit?: number;
    maxUnit?: number;
    fixedPrice?: number;
  } | string;
  multipliers?: {
    express?: number;
    pickRole?: number;
    duo?: number;
  } | string;
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
  startRankTierId?: string;
  targetRankTierId?: string;
  currentUnit?: number;
  targetUnit?: number;
  quantity?: number;
  options?: {
    isExpress?: boolean;
    pickRole?: boolean;
    isDuo?: boolean;
  };
  customOptions?: SelectedCustomOption[];
}

export interface CalculatePriceResult {
  basePrice: number;
  multiplier: number;
  totalPrice: number;
  serviceType?: string;
  unitsDiff?: number;
  unitLabel?: string;
  appliedOptions?: Array<{
    key: string;
    name: string;
    percentage: number;
    inputValue?: string;
  }>;
}

export interface CreateOrderRequestBody {
  serviceId: string;
  startRankTierId?: string;
  targetRankTierId?: string;
  currentUnit?: number;
  targetUnit?: number;
  quantity?: number;
  options?: {
    isExpress?: boolean;
    pickRole?: boolean;
    isDuo?: boolean;
  };
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
