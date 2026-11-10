import mongoose, { Schema, type InferSchemaType, type Types } from 'mongoose';

export const gameSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên game không được để trống'],
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    thumbnail: {
      type: String,
      required: [true, 'Ảnh đại diện game là bắt buộc']
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
  { timestamps: true }
);

export type GameSchemaType = InferSchemaType<typeof gameSchema>;
export type IGame = GameSchemaType & { _id: Types.ObjectId };

export const Game = mongoose.model('Game', gameSchema);
export default Game;
