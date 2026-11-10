import mongoose, { Schema, type InferSchemaType, type Types } from 'mongoose';

export const customOptionSchema = new Schema(
  {
    key: {
      type: String,
      required: [true, 'Mã định danh tùy chọn (key) là bắt buộc'],
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Tên tùy chọn mở rộng là bắt buộc'],
      trim: true
    },
    percentage: {
      type: Number,
      required: true,
      default: 0
    },
    requiresInput: {
      type: Boolean,
      default: false
    },
    inputPlaceholder: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { _id: true }
);

export const DEFAULT_CUSTOM_OPTIONS = [
  {
    key: 'express',
    name: 'Cày siêu tốc (Express)',
    percentage: 35,
    requiresInput: false,
    inputPlaceholder: '',
    description: 'Ưu tiên cày ngày đêm hoàn thành sớm nhất',
    isActive: true
  },
  {
    key: 'pick_hero',
    name: 'Chỉ định tướng tủ',
    percentage: 25,
    requiresInput: false,
    inputPlaceholder: '',
    description: 'Booster sẽ đánh theo danh sách tướng bạn ghi chú',
    isActive: true
  }
];

export const serviceSchema = new Schema(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Dịch vụ phải thuộc một game cụ thể']
    },
    name: {
      type: String,
      required: [true, 'Tên dịch vụ không được để trống'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    thumbnail: {
      type: String,
      required: [true, 'Ảnh đại diện service là bắt buộc']
    },
    customOptions: {
      type: [customOptionSchema],
      default: DEFAULT_CUSTOM_OPTIONS
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export type ServiceSchemaType = InferSchemaType<typeof serviceSchema>;
export type IService = ServiceSchemaType & { _id: Types.ObjectId };
export type ICustomOption = InferSchemaType<typeof customOptionSchema> & { _id: Types.ObjectId };

export const Service = mongoose.model('Service', serviceSchema);
export default Service;
