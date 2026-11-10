# Thiết Kế Cơ Sở Dữ Liệu MongoDB (Mongoose Schemas)
Dự án: **Hệ Thống Dịch Vụ Thể Thao Điện Tử & Cày Rank (Esports Gaming Services)**

---

## 1. Sơ đồ thực thể và quan hệ (ERD Overview)

Hệ thống gồm 6 Collection chính kết nối trực tiếp với nhau:
* `User`: Quản trị viên (`admin`) và Khách hàng (`client`).
* `Game`: Danh mục game (Liên Quân, LMHT, Valorant...).
* `RankTier`: Bảng phân bậc rank và giá vượt bậc theo từng game (`ref: Game`).
* `Service`: Gói dịch vụ cày rank, hệ số phụ phí (`ref: Game`).
* `Order`: Đơn hàng cày rank chứa thông tin tài khoản in-game, cấu hình chặng cày, trạng thái thanh toán và thông tin hoàn tiền (`ref: User`, `ref: Service`, `ref: RankTier`).
* `Review`: Phản hồi và đánh giá sau khi hoàn thành đơn (`ref: User`, `ref: Service`, `ref: Order`).

---

## 2. Chi tiết các Schema (Mongoose Code)

### 2.1. Collection: `users`
Lưu trữ tài khoản xác thực, phân quyền và liên kết OAuth (nếu có).

```javascript
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
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
      enum: ['client', 'admin'],
      default: 'client'
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
```

---

### 2.2. Collection: `games` (Category)
Danh mục các tựa game được hỗ trợ.

```javascript
import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema(
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

export const Game = mongoose.model('Game', gameSchema);
```

---

### 2.3. Collection: `rank_tiers`
Lưu trữ danh sách thứ tự bậc rank và chi phí leo tiếp theo để phục vụ thuật toán tính giá.

```javascript
import mongoose from 'mongoose';

const rankTierSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Game ID là bắt buộc']
    },
    name: {
      type: String,
      required: [true, 'Tên bậc rank không được để trống'], // VD: "Vàng IV", "Bạch Kim I"
      trim: true
    },
    index: {
      type: Number,
      required: [true, 'Chỉ số thứ tự bậc rank là bắt buộc'] // 0, 1, 2, 3... tăng dần
    },
    costToNext: {
      type: Number,
      required: [true, 'Chi phí vượt bậc là bắt buộc'], // Chi phí để cày lên rank kế tiếp (VNĐ)
      min: [0, 'Chi phí không thể âm']
    }
  },
  { timestamps: true }
);

// Đảm bảo không trùng index trong cùng một game
rankTierSchema.index({ gameId: 1, index: 1 }, { unique: true });

export const RankTier = mongoose.model('RankTier', rankTierSchema);
```

---

### 2.4. Collection: `services` (Product)
Định nghĩa gói cày rank và hệ số nhân giá phụ phí.

```javascript
import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: [true, 'Dịch vụ phải thuộc một game cụ thể']
    },
    name: {
      type: String,
      required: [true, 'Tên dịch vụ không được để trống'], // VD: "Cày Siêu Tốc", "Cày Rank Chuẩn"
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
    multipliers: {
      express: { type: Number, default: 1.25 }, // Cày gấp (+25%)
      pickRole: { type: Number, default: 1.15 }, // Chỉ định tướng/vị trí (+15%)
      duo: { type: Number, default: 1.5 }       // Duo cùng booster (+50%)
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export const Service = mongoose.model('Service', serviceSchema);
```

---

### 2.5. Collection: `orders`
Gộp trực tiếp thông tin cấu hình gói cày, tài khoản in-game, trạng thái thanh toán và thông tin hoàn tiền (không dùng `order_items`).

```javascript
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true // VD: "CT10892" dùng làm mã nhận diện chuyển khoản VietQR
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người đặt đơn là bắt buộc']
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Dịch vụ là bắt buộc']
    },

    // Cấu hình chặng cày
    startRankTierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RankTier',
      required: [true, 'Bậc rank hiện tại là bắt buộc']
    },
    targetRankTierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RankTier',
      required: [true, 'Bậc rank mục tiêu là bắt buộc']
    },
    options: {
      isExpress: { type: Boolean, default: false },
      pickRole: { type: Boolean, default: false },
      isDuo: { type: Boolean, default: false }
    },

    // Thông tin tài khoản in-game
    accountInfo: {
      inGameAccount: { type: String, required: [true, 'Tài khoản game là bắt buộc'] },
      inGamePassword: { type: String, required: [true, 'Mật khẩu game là bắt buộc'] },
      inGameServer: { type: String, default: 'VN' },
      inGameName: { type: String, default: '' },
      contactPhone: { type: String, required: [true, 'Số điện thoại/Zalo liên hệ là bắt buộc'] },
      note: { type: String, default: '' }
    },

    // Giá trị đơn
    basePrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },

    // Trạng thái thanh toán
    paymentMethod: {
      type: String,
      enum: ['VIETQR', 'MOCK_CARD'],
      default: 'VIETQR'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },

    // Trạng thái thực hiện đơn hàng
    orderStatus: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'canceled'],
      default: 'pending'
    },

    // Bàn giao kết quả
    proofImage: {
      type: String,
      default: null // Ảnh chụp màn hình chiến thắng/đạt rank do Admin upload
    },

    // Nghiệp vụ hủy & hoàn tiền
    cancelReason: {
      type: String,
      default: null
    },
    refundInfo: {
      bankName: { type: String, default: null },
      accountNumber: { type: String, default: null },
      accountHolder: { type: String, default: null },
      refundProof: { type: String, default: null }, // Ảnh bill Admin chuyển khoản trả lại
      refundedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
```

---

### 2.6. Collection: `reviews`
Đánh giá chất lượng sau khi đơn hoàn tất.

```javascript
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true // Mỗi đơn hàng chỉ được đánh giá 1 lần
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

export const Review = mongoose.model('Review', reviewSchema);
```