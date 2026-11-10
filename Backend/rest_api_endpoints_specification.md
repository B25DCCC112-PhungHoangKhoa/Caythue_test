# Đặc Tả Kỹ Thuật REST API Endpoints (Express.js)
Dự án: **Hệ Thống Dịch Vụ Thể Thao Điện Tử & Cày Rank (Esports Gaming Services)**

---

## 1. Chuẩn Quy Ước Mã Trạng Thái HTTP (Status Codes)

* `200 OK`: Truy vấn, cập nhật thành công.
* `201 Created`: Tạo mới thành công (Đăng ký, tạo Game, tạo Service, tạo Đơn).
* `400 Bad Request`: Thiếu trường dữ liệu, dữ liệu không hợp lệ, rank đích $\le$ rank hiện tại.
* `401 Unauthorized`: Chưa đăng nhập hoặc Token JWT không hợp lệ/hết hạn.
* `403 Forbidden`: Không có quyền truy cập (Người dùng thường cố truy cập route Admin).
* `404 Not Found`: Không tìm thấy tài nguyên theo ID/Slug.
* `500 Internal Server Error`: Lỗi phát sinh từ máy chủ.

---

## 2. Danh Sách Chi Tiết Các Endpoints

### 2.1. Phân Hệ Xác Thực (`/api/auth`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản khách hàng mới. |
| `POST` | `/api/auth/login` | Public | Đăng nhập tài khoản, trả về JWT Token và thông tin User. |
| `GET` | `/api/auth/me` | Client/Admin | Lấy thông tin tài khoản hiện tại từ Token JWT. |

#### Request mẫu: `POST /api/auth/register`
```json
{
  "name": "Nguyen Van A",
  "email": "vana@gmail.com",
  "password": "Password123",
  "phoneNumber": "0987654321"
}
```

#### Response mẫu: `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "651a2b...",
    "name": "Nguyen Van A",
    "email": "vana@gmail.com",
    "role": "client"
  }
}
```

---

### 2.2. Phân Hệ Quản Lý Game (`/api/games`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/games` | Public | Danh sách tất cả game đang hoạt động. |
| `GET` | `/api/games/:slug` | Public | Chi tiết 1 game theo slug (kèm danh sách dịch vụ của game). |
| `POST` | `/api/games` | Admin | Tạo mới một tựa game (tên, slug, thumbnail). |
| `PUT` | `/api/games/:id` | Admin | Sửa thông tin game. |
| `DELETE` | `/api/games/:id` | Admin | Xóa mềm hoặc xóa hoàn toàn một game. |

---

### 2.3. Phân Hệ Phân Bậc Rank (`/api/rank-tiers`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/rank-tiers?gameId=...` | Public | Lấy danh sách bậc rank theo từng game, sắp xếp theo `index` tăng dần. |
| `POST` | `/api/rank-tiers` | Admin | Thêm mới 1 bậc rank cho game (name, index, costToNext). |
| `PUT` | `/api/rank-tiers/:id` | Admin | Sửa tên bậc rank hoặc chi phí vượt bậc. |
| `DELETE` | `/api/rank-tiers/:id` | Admin | Xóa bậc rank. |

---

### 2.4. Phân Hệ Gói Dịch Vụ (`/api/services`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/services?gameId=...` | Public | Danh sách dịch vụ theo Game. |
| `GET` | `/api/services/:id` | Public | Chi tiết gói dịch vụ và các hệ số phụ phí. |
| `POST` | `/api/services` | Admin | Thêm gói dịch vụ mới cho game. |
| `PUT` | `/api/services/:id` | Admin | Cập nhật hệ số nhân phụ phí và thông tin dịch vụ. |
| `DELETE` | `/api/services/:id` | Admin | Xóa dịch vụ. |

---

### 2.5. Phân Hệ Đơn Hàng & Tính Giá (`/api/orders`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/calculate` | Public | API xem trước giá tiền: nhận rank nguồn, rank đích, options $\rightarrow$ trả về chi phí dự tính. |
| `POST` | `/api/orders` | Client | Tạo đơn hàng mới, validate lại giá ở backend, sinh mã `orderCode` và trả về URL ảnh VietQR. |
| `GET` | `/api/orders/my-orders` | Client | Danh sách các đơn hàng của khách đang đăng nhập. |
| `GET` | `/api/orders/:id` | Client/Admin | Chi tiết đơn hàng, tiến độ, tài khoản in-game, bằng chứng hoàn thành. |
| `PATCH` | `/api/orders/:id/refund-info` | Client | Khách gửi thông tin STK ngân hàng khi đơn hàng bị Admin hủy. |
| `GET` | `/api/orders` | Admin | Danh sách tất cả đơn hàng trên hệ thống (hỗ trợ query `status`, `page`, `limit`). |
| `PATCH` | `/api/orders/:id/status` | Admin | Cập nhật trạng thái đơn (`in_progress`, `completed`, `canceled`), upload `proofImage` hoặc nhập `cancelReason`. |
| `PATCH` | `/api/orders/:id/confirm-refund` | Admin | Xác nhận đã hoàn tiền cho khách (cập nhật `refundProof`, đổi `paymentStatus = refunded`). |

#### Request mẫu: `POST /api/orders/calculate` (Tính giá thử nghiệm)
```json
{
  "serviceId": "651c3d...",
  "startRankTierId": "651c4e...",
  "targetRankTierId": "651c5f...",
  "options": {
    "isExpress": true,
    "pickRole": false,
    "isDuo": false
  }
}
```

#### Response mẫu: `200 OK`
```json
{
  "success": true,
  "basePrice": 180000,
  "multiplier": 1.25,
  "totalPrice": 225000
}
```

#### Request mẫu: `POST /api/orders` (Tạo đơn hàng chính thức)
```json
{
  "serviceId": "651c3d...",
  "startRankTierId": "651c4e...",
  "targetRankTierId": "651c5f...",
  "options": {
    "isExpress": true,
    "pickRole": false,
    "isDuo": false
  },
  "accountInfo": {
    "inGameAccount": "player_one",
    "inGamePassword": "secret_password",
    "inGameServer": "VN",
    "inGameName": "YasuoGankTem",
    "contactPhone": "0987654321",
    "note": "Cày trong khung giờ đêm giúp mình"
  }
}
```

#### Response mẫu: `201 Created`
```json
{
  "success": true,
  "message": "Tạo đơn hàng thành công",
  "order": {
    "_id": "652d8f...",
    "orderCode": "CT40819",
    "totalPrice": 225000,
    "paymentStatus": "pending",
    "orderStatus": "pending",
    "qrUrl": "https://img.vietqr.io/image/MBBANK-0987654321-compact.png?amount=225000&addInfo=CT40819"
  }
}
```

#### Request mẫu: `PATCH /api/orders/:id/refund-info` (Khách gửi STK khi đơn bị hủy)
```json
{
  "bankName": "MBBank",
  "accountNumber": "0388123456",
  "accountHolder": "NGUYEN VAN A"
}
```

#### Request mẫu: `PATCH /api/orders/:id/status` (Admin cập nhật tiến độ / hoàn tất)
```json
{
  "orderStatus": "completed",
  "proofImage": "https://res.cloudinary.com/.../rank_victory.png"
}
```

---

### 2.6. Phân Hệ Đánh Giá (`/api/reviews`)

| Method | Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reviews?serviceId=...` | Public | Lấy danh sách đánh giá của một dịch vụ. |
| `POST` | `/api/reviews` | Client | Gửi đánh giá và chấm sao cho đơn hàng đã hoàn tất (`orderStatus === 'completed'`). |
| `DELETE` | `/api/reviews/:id` | Admin | Xóa đánh giá vi phạm tiêu chuẩn cộng đồng. |

#### Request mẫu: `POST /api/reviews`
```json
{
  "orderId": "652d8f...",
  "serviceId": "651c3d...",
  "rating": 5,
  "comment": "Shop cày nhanh, bảo mật tài khoản tốt, win rate cao!"
}
```