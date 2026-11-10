import mongoose, { Schema, type InferSchemaType, type Types } from 'mongoose';

export const orderSchema = new Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    transferCode: {
      type: String,
      default: null
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người đặt đơn là bắt buộc']
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Dịch vụ là bắt buộc']
    },
    serviceConfig: {
      serviceType: {
        type: String,
        enum: ['RANK_TIER', 'PER_UNIT', 'MATCH_COUNT', 'FIXED_PACKAGE'],
        default: 'RANK_TIER'
      },
      currentUnit: { type: Number, default: null },
      targetUnit: { type: Number, default: null },
      unitLabel: { type: String, default: '' },
      quantity: { type: Number, default: null },
      packageName: { type: String, default: '' }
    },
    startRankTierId: {
      type: Schema.Types.ObjectId,
      ref: 'RankTier',
      required: false,
      default: null
    },
    targetRankTierId: {
      type: Schema.Types.ObjectId,
      ref: 'RankTier',
      required: false,
      default: null
    },
    options: {
      isExpress: { type: Boolean, default: false },
      pickRole: { type: Boolean, default: false },
      isDuo: { type: Boolean, default: false }
    },
    customOptions: [
      {
        key: { type: String, required: true },
        name: { type: String, required: true },
        percentage: { type: Number, default: 0 },
        inputValue: { type: String, default: '' }
      }
    ],
    accountInfo: {
      inGameAccount: { type: String, required: [true, 'Tài khoản game là bắt buộc'] },
      inGamePassword: { type: String, required: [true, 'Mật khẩu game là bắt buộc'] },
      inGameServer: { type: String, default: 'VN' },
      inGameName: { type: String, default: '' },
      contactPhone: { type: String, default: '' },
      note: { type: String, default: '' }
    },
    basePrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['VIETQR', 'MOCK_CARD'] as const,
      default: 'VIETQR' as const
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'] as const,
      default: 'pending' as const
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'canceled'] as const,
      default: 'pending' as const
    },
    proofImage: {
      type: String,
      default: null
    },
    cancelReason: {
      type: String,
      default: null
    },
    refundInfo: {
      bankName: { type: String, default: null },
      accountNumber: { type: String, default: null },
      accountHolder: { type: String, default: null },
      refundProof: { type: String, default: null },
      refundedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

export type OrderSchemaType = InferSchemaType<typeof orderSchema>;
export type IOrder = OrderSchemaType & { _id: Types.ObjectId };
export type IServiceConfig = NonNullable<OrderSchemaType['serviceConfig']>;
export type IOrderOptions = NonNullable<OrderSchemaType['options']>;
export type IAccountInfo = NonNullable<OrderSchemaType['accountInfo']>;
export type IRefundInfo = NonNullable<OrderSchemaType['refundInfo']>;
export type PaymentMethod = NonNullable<OrderSchemaType['paymentMethod']>;
export type PaymentStatus = NonNullable<OrderSchemaType['paymentStatus']>;
export type OrderStatus = NonNullable<OrderSchemaType['orderStatus']>;

export const Order = mongoose.model('Order', orderSchema);
export default Order;
