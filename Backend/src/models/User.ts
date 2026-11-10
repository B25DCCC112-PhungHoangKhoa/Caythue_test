import mongoose, { Schema, type InferSchemaType, type Types } from 'mongoose';

export const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Họ tên không được để trống'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không đúng định dạng']
    },
    password: {
      type: String,
      minlength: [6, 'Mật khẩu phải có tối thiểu 6 ký tự']
    },
    googleId: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: ['client', 'admin'] as const,
      default: 'client' as const
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

export type UserSchemaType = InferSchemaType<typeof userSchema>;
export type IUser = UserSchemaType & { _id: Types.ObjectId };
export type UserRole = UserSchemaType['role'];

export const User = mongoose.model('User', userSchema);
export default User;
