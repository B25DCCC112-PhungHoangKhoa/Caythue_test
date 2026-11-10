// ==========================================
// ENUMS & UNION TYPES
// ==========================================
export type UserRole = 'client' | 'admin';
export type PaymentMethod = 'VIETQR' | 'MOCK_CARD';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'canceled';
export type RefundStatus = 'none' | 'pending' | 'refunded';
export type ServiceType = 'RANK_TIER' | 'PER_UNIT' | 'MATCH_COUNT' | 'FIXED_PACKAGE';

export interface IPriceConfig {
  unitPrice?: number;
  unitLabel?: string;
  minUnit?: number;
  maxUnit?: number;
  fixedPrice?: number;
}

export interface IServiceConfig {
  serviceType: ServiceType;
  currentUnit?: number | null;
  targetUnit?: number | null;
  unitLabel?: string;
  quantity?: number | null;
  packageName?: string;
}

// ==========================================
// 6 CORE ENTITY INTERFACES
// ==========================================

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber?: string | null;
  googleId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IGame {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IRankTier {
  _id: string;
  gameId: string | IGame;
  name: string;
  index: number;
  costToNext: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IServiceMultipliers {
  express: number;
  pickRole: number;
  duo: number;
}

export interface ICustomOption {
  _id?: string;
  key: string;
  name: string;
  percentage: number;
  requiresInput: boolean;
  inputPlaceholder?: string;
  description?: string;
  isActive: boolean;
}

export interface IService {
  _id: string;
  gameId: string | IGame;
  name: string;
  description?: string;
  thumbnail: string;
  serviceType?: ServiceType;
  priceConfig?: IPriceConfig;
  multipliers: IServiceMultipliers;
  customOptions?: ICustomOption[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrderOptions {
  isExpress: boolean;
  pickRole: boolean;
  isDuo: boolean;
}

export interface IOrderCustomOption {
  key: string;
  name: string;
  percentage: number;
  inputValue?: string;
}

export interface IAccountInfo {
  inGameAccount: string;
  inGamePassword?: string;
  inGameServer: string;
  inGameName?: string;
  contactPhone?: string;
  note?: string;
}

export interface IBankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
}

export interface IRefundInfo {
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
  refundProof?: string | null;
  refundedAt?: string | null;
}

export interface IOrder {
  _id: string;
  orderCode: string;
  transferCode?: string;
  transferMessage?: string;
  bankInfo?: IBankInfo;
  userId: string | IUser;
  serviceId: string | IService;
  serviceConfig?: IServiceConfig;
  startRankTierId?: string | IRankTier | null;
  targetRankTierId?: string | IRankTier | null;
  options: IOrderOptions;
  customOptions?: IOrderCustomOption[];
  accountInfo: IAccountInfo;
  basePrice: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  proofImage?: string | null;
  cancelReason?: string | null;
  refundInfo: IRefundInfo;
  qrUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IReview {
  _id: string;
  userId: string | IUser;
  serviceId: string | IService;
  orderId: string | IOrder;
  rating: number;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// API PAYLOAD & RESPONSE INTERFACES
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phoneNumber?: string | null;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface CalculatePricePayload {
  serviceId: string;
  startRankTierId?: string;
  targetRankTierId?: string;
  currentUnit?: number;
  targetUnit?: number;
  quantity?: number;
  options?: Partial<IOrderOptions>;
  customOptions?: Array<{ key: string; inputValue?: string }>;
}

export interface CalculatePriceResponse {
  success: boolean;
  basePrice: number;
  multiplier: number;
  totalPrice: number;
  serviceType?: ServiceType;
  unitsDiff?: number;
  unitLabel?: string;
  appliedOptions?: IOrderCustomOption[];
  message?: string;
}

export interface CreateOrderPayload {
  serviceId: string;
  startRankTierId?: string;
  targetRankTierId?: string;
  currentUnit?: number;
  targetUnit?: number;
  quantity?: number;
  options?: Partial<IOrderOptions>;
  customOptions?: Array<{ key: string; inputValue?: string }>;
  accountInfo: {
    inGameAccount: string;
    inGamePassword: string;
    inGameServer?: string;
    inGameName?: string;
    contactPhone?: string;
    note?: string;
  };
  paymentMethod?: PaymentMethod;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: {
    _id: string;
    orderCode: string;
    transferCode?: string;
    transferMessage?: string;
    totalPrice: number;
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    qrUrl: string;
    bankInfo?: IBankInfo;
  };
}

export interface RefundInfoPayload {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface UpdateOrderStatusPayload {
  orderStatus: OrderStatus;
  proofImage?: string;
  cancelReason?: string;
}

export interface ConfirmRefundPayload {
  refundProof?: string;
}

export interface CreateReviewPayload {
  orderId: string;
  serviceId: string;
  rating: number;
  comment: string;
}

export interface OrdersListResponse {
  success: boolean;
  count: number;
  total?: number;
  page?: number;
  totalPages?: number;
  orders: IOrder[];
}

