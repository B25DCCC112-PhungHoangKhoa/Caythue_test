import mongoose, { Schema, type InferSchemaType, type Types } from 'mongoose';

export const rankTierSchema = new Schema(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Game ID là bắt buộc']
    },
    name: {
      type: String,
      required: [true, 'Tên bậc rank không được để trống'],
      trim: true
    },
    index: {
      type: Number,
      required: [true, 'Chỉ số thứ tự bậc rank là bắt buộc']
    },
    costToNext: {
      type: Number,
      required: [true, 'Chi phí vượt bậc là bắt buộc'],
      min: [0, 'Chi phí không thể âm']
    }
  },
  { timestamps: true }
);

rankTierSchema.index({ gameId: 1, index: 1 }, { unique: true });

export type RankTierSchemaType = InferSchemaType<typeof rankTierSchema>;
export type IRankTier = RankTierSchemaType & { _id: Types.ObjectId };

export const RankTier = mongoose.model('RankTier', rankTierSchema);
export default RankTier;
