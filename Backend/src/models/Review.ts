import mongoose, { Schema, type InferSchemaType, type Types } from 'mongoose';

export const reviewSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true
    },
    rating: {
      type: Number,
      required: [true, 'Số sao là bắt buộc'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Bình luận không được để trống'],
      trim: true
    }
  },
  { timestamps: true }
);

export type ReviewSchemaType = InferSchemaType<typeof reviewSchema>;
export type IReview = ReviewSchemaType & { _id: Types.ObjectId };

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
