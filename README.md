# 🎮 CayGame - Nền Tảng Dịch Vụ Cày Thuê Rank Esports

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Express 5](https://img.shields.io/badge/Express.js_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SePay](https://img.shields.io/badge/SePay-Banking_Webhook-0052CC?style=for-the-badge)](https://sepay.vn/)

> **CayGame** là nền tảng thương mại dịch vụ cày thuê rank thể thao điện tử (Esports) thế hệ mới, tối ưu cho trải nghiệm người dùng với hệ thống tính giá minh bạch, thanh toán tự động qua **VietQR + SePay Banking Webhook**, đồng bộ thời gian thực và bàn làm việc chuyên biệt dành cho Booster/Admin.

---

## 📑 Mục Lục

- [✨ Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [🏗️ Kiến Trúc Hệ Thống & Sơ Đồ Tương Tác](#️-kiến-trúc-hệ-thống--sơ-đồ-tương-tác)
- [🛠️ Công Nghệ Sử Dụng (Tech Stack)](#️-công-nghệ-sử-dụng-tech-stack)
- [📁 Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Local](#-hướng-dẫn-cài-đặt--chạy-môi-trường-local)
- [⚙️ Cấu Hình Biến Môi Trường (Environment Variables)](#️-cấu-hình-biến-môi-trường-environment-variables)
- [🌐 Hướng Dẫn Triển Khai (Deployment Guide)](#-hướng-dẫn-triển-khai-deployment-guide)
- [📄 Bản Quyền & Giấy Phép](#-bản-quyền--giấy-phép)

---

## ✨ Tính Năng Nổi Bật

### 1. Phía Khách Hàng (Client Portal)
* **Cấu hình cày rank trực quan:** Chọn tựa game, bậc rank bắt đầu và bậc rank mong muốn với giao diện kéo thả/chọn bậc bắt mắt.
* **Bảng tính giá minh bạch:** Giá được tính toán tức thì theo khoảng cách cấp bậc (`costToNext`) và cộng thêm phụ phí cấu hình mở rộng:
  * ⚡ **Cày siêu tốc (Express):** Ưu tiên cày liên tục ngày đêm (+35%).
  * 🎯 **Chỉ định tướng tủ (Pick Hero):** Booster đánh theo danh sách tướng khách yêu cầu (+25%).
* **Bảo mật nick game:** Form nhập tài khoản, mật khẩu, server và số điện thoại liên hệ nhận OTP an toàn.
* **Thanh toán tự động với VietQR & SePay:**
  * Sinh mã VietQR động chuẩn Napas 247 kèm cú pháp định danh: `NAP <transferCode>`.
  * Đồng hồ đếm ngược giao dịch 10 phút.
  * Cơ chế Polling tự động kiểm tra mỗi 3 giây qua endpoint tối ưu không để lộ mật khẩu game.
  * Ngay khi tài khoản ngân hàng nhận tiền, SePay Webhook kích hoạt khớp đơn -> màn hình tự động hiển thị thông báo chúc mừng xanh ngọc và chuyển hướng thẳng vào trang chi tiết đơn hàng.
* **Theo dõi & Nghiệm thu đơn hàng:** Kiểm tra trạng thái đơn (`pending`, `in_progress`, `completed`, `canceled`), xem ảnh chụp màn hình chiến thắng từ Booster.
* **Đánh giá dịch vụ & Hoàn tiền:** Đánh giá số sao (1-5 sao), viết phản hồi hoặc gửi thông tin STK ngân hàng nhận tiền hoàn nếu đơn bị hủy.

### 2. Phía Quản Trị & Booster (Admin Portal)
* **Bảng điều khiển thống kê (Dashboard):** Đo lường doanh thu, tổng số đơn, đơn đang cày, đơn hoàn thành và tỷ lệ hủy.
* **Quản lý đơn hàng (Orders):** Xem danh sách đơn, mở khóa xem thông tin nick game để cày, chuyển trạng thái đơn hàng.
* **Tải lên chứng từ chiến thắng (Proof Upload):** Tải ảnh chụp màn hình đạt rank mục tiêu trực tiếp lên Cloudinary CDN để lưu vết minh bạch.
* **Quản lý danh mục:** Thêm, sửa, ẩn/hiện Game, Dịch vụ, và Cấu hình bảng giá bậc Rank (`RankTier`).
* **Quản trị người dùng:** Quản lý danh sách tài khoản khách hàng và phân quyền hệ thống (RBAC).

---

## 🏗️ Kiến Trúc Hệ Thống & Sơ Đồ Tương Tác

Dự án tích hợp bộ tài liệu thiết kế kiến trúc chuẩn **Archify 3.2** với 4 sơ đồ HTML độc lập, hỗ trợ phóng to/thu nhỏ (Pan & Zoom), hiệu ứng chuyển động luồng (Trace Motion), chế độ Sáng/Tối và xuất ảnh vector:

👉 **[Mở Trung Tâm Sơ Đồ CayGame Suite (Unified Portal)](file:///home/khoa/Projects/TS/CayGame_test/docs/diagrams/index.html)**

| Sơ Đồ | File HTML Trực Quan | Nội Dung Chi Tiết |
| :--- | :--- | :--- |
| **Kiến Trúc Hệ Thống (Architecture)** | [caygame-architecture.html](file:///home/khoa/Projects/TS/CayGame_test/docs/diagrams/caygame-architecture.html) | Mô hình 3-Tier: Client (Vercel Edge) ➔ API (Render) ➔ MongoDB Atlas, Cloudinary CDN, VietQR & SePay Webhook. |
| **Luồng Dữ Liệu (DFD)** | [caygame-dataflow.html](file:///home/khoa/Projects/TS/CayGame_test/docs/diagrams/caygame-dataflow.html) | Luồng qua 5 tầng: *Nguồn Dữ Liệu ➔ Tiếp Nhận & Điều Hướng ➔ Xử Lý & Đối Soát ➔ Lưu Trữ Bền Vững ➔ Đồng Bộ & Phản Hồi*. |
| **Quy Trình Nghiệp Vụ (Workflow)** | [caygame-workflow.html](file:///home/khoa/Projects/TS/CayGame_test/docs/diagrams/caygame-workflow.html) | Chu trình 10 bước khép kín: Chọn rank ➔ Bảng tính giá ➔ Quét VietQR ➔ SePay khớp đơn ➔ Polling 3s ➔ Booster cày & upload ảnh thắng. |
| **Quan Hệ Thực Thể (Crow's Foot ERD)** | [caygame-erd.html](file:///home/khoa/Projects/TS/CayGame_test/docs/diagrams/caygame-erd.html) | Chuẩn Chân Quạ: `user`, `game`, `service`, `rank_tier`, `order` (chứa `accountInfo`, `customOptions`), `review`. |

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Frontend
* **Core:** React 19, TypeScript, Vite 6
* **Routing:** React Router DOM v6/v7
* **State Management:** Zustand (có middleware persist cho xác thực người dùng)
* **Styling:** Tailwind CSS, Lucide Icons, clsx, tailwind-merge
* **HTTP Client:** Axios với Request/Response Interceptors tự động đính kèm JWT Bearer Token

### Backend
* **Runtime & Framework:** Node.js (ES Modules, TypeScript), Express 5
* **Database & ODM:** MongoDB Atlas, Mongoose 9
* **Authentication:** JSON Web Token (JWT), bcryptjs
* **File Uploads:** Multer (Memory Storage) kết hợp Cloudinary SDK v2
* **Payment Gateway:** SePay Webhook Engine (`/api/hooks/sepay-payment`), VietQR.io Generator

---

## 📁 Cấu Trúc Dự Án

```bash
CayGame_test/
├── Backend/                      # Máy chủ API Node.js / Express 5
│   ├── src/
│   │   ├── config/               # Cấu hình Database & Cloudinary
│   │   ├── controllers/          # Bộ điều khiển nghiệp vụ (Auth, Order, Payment, Game, Service, Review)
│   │   ├── middlewares/          # Middleware xác thực JWT, RBAC & xử lý lỗi tập trung
│   │   ├── models/               # Mongoose Schemas (User, Order, Service, RankTier, Game, Review)
│   │   ├── routes/               # API Endpoints Router
│   │   ├── utils/                # Thuật toán tính giá rank & sinh mã VietQR
│   │   ├── seed.ts               # Dữ liệu mẫu (Database Seeding)
│   │   └── server.ts             # Khởi chạy Express Server
│   ├── package.json
│   └── tsconfig.json
│
├── Frontend/                     # Giao diện người dùng React 19 SPA
│   ├── src/
│   │   ├── api/                  # Axios Client & Interceptors
│   │   ├── components/           # Component dùng chung (Navbar, Footer, VietQRPaymentCard, VietQRModal)
│   │   ├── pages/                # Các trang Client & Quản trị Admin
│   │   ├── store/                # Zustand State Stores (useAuthStore, useBookingStore)
│   │   ├── types/                # TypeScript Interfaces & Types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docs/
│   └── diagrams/                 # Hệ thống sơ đồ kiến trúc tương tác Archify 3.2
│       ├── index.html            # Cổng xem tổng hợp 4 sơ đồ (Tiếng Việt)
│       ├── caygame-architecture.html
│       ├── caygame-dataflow.html
│       ├── caygame-workflow.html
│       └── caygame-erd.html
│
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Local

### Yêu Cầu Tiên Quyết
* **Node.js:** Phiên bản `>= 18.x` hoặc `20.x` / `24.x LTS`
* **npm:** Phiên bản `>= 9.x`
* **MongoDB:** Chuỗi kết nối MongoDB Atlas (hoặc MongoDB cục bộ)
* **Cloudinary Account:** Để lấy Cloud Name, API Key và Secret
* **SePay Account:** (Tùy chọn cho webhook ngân hàng)

---

### Bước 1: Khởi Tạo Backend

1. Mở terminal và chuyển vào thư mục `Backend`:
   ```bash
   cd Backend
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   ```
   *Điền các thông số kết nối MongoDB, JWT Secret và Cloudinary vào `.env`.*

4. Chạy dữ liệu mẫu ban đầu (Seed database với Game, Dịch Vụ và Rank mẫu):
   ```bash
   npm run seed
   ```

5. Khởi chạy server Backend ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   > Backend sẽ lắng nghe tại: `http://localhost:5000`

---

### Bước 2: Khởi Tạo Frontend

1. Mở một tab terminal mới và chuyển vào thư mục `Frontend`:
   ```bash
   cd Frontend
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   ```

3. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   ```
   *Đảm bảo giá trị biến là:*
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. Khởi chạy ứng dụng Frontend:
   ```bash
   npm run dev
   ```
   > Mở trình duyệt và truy cập: `http://localhost:5173`

---

## ⚙️ Cấu Hình Biến Môi Trường (Environment Variables)

### 1. Phía Backend (`Backend/.env`)

| Tên Biến | Ý Nghĩa | Giá Trị Mẫu |
| :--- | :--- | :--- |
| `PORT` | Cổng mạng máy chủ Express | `5000` |
| `MONGODB_URI` | Chuỗi kết nối MongoDB Atlas | `mongodb+srv://<user>:<pwd>@cluster.mongodb.net/caygame` |
| `JWT_SECRET` | Khóa bí mật ký token JWT | `super_secret_jwt_key_2026` |
| `CLOUDINARY_CLOUD_NAME` | Tên cloud lưu trữ Cloudinary | `my_cloud_name` |
| `CLOUDINARY_API_KEY` | Khóa API Cloudinary | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Khóa bí mật Cloudinary | `AbCdEfGhIjKlMnOpQrStUvWxYz` |
| `SEPAY_WEBHOOK_KEY` | *(Tùy chọn)* Khóa xác thực webhook từ SePay | `sepay_api_token_here` |
| `BANK_BIN` | Mã BIN ngân hàng nhận tiền (BIDV: 970418, MB: 970422) | `970418` |
| `BANK_ACCOUNT_NO` | Số tài khoản ngân hàng nhận tiền cày thuê | `1210512384` |

### 2. Phía Frontend (`Frontend/.env`)

| Tên Biến | Ý Nghĩa | Môi Trường Local | Môi Trường Production |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Địa chỉ URL gốc của API Backend | `http://localhost:5000/api` | `https://caythue-test.onrender.com/api` |

> [!IMPORTANT]
> Trên **Vercel**, khi thêm biến môi trường `VITE_API_BASE_URL`, bạn phải chọn **Type là `Config`** (không chọn Secret) vì biến tiền tố `VITE_` được dùng trực tiếp ở trình duyệt.

---

## 🌐 Hướng Dẫn Triển Khai (Deployment Guide)

### Triển khai Backend lên Render
1. Tạo một **Web Service** mới trên [Render Dashboard](https://render.com).
2. Kết nối tới kho mã nguồn GitHub của bạn.
3. Thiết lập thông số:
   * **Root Directory:** `Backend`
   * **Environment:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
4. Cấu hình các **Environment Variables** theo danh sách phía trên.
5. Lấy URL dịch vụ (ví dụ: `https://caythue-test.onrender.com`).
6. Cấu hình webhook trên [SePay.vn](https://my.sepay.vn):
   * **Webhook URL:** `https://caythue-test.onrender.com/api/hooks/sepay-payment`

---

### Triển khai Frontend lên Vercel
1. Import kho mã nguồn trên [Vercel Dashboard](https://vercel.com).
2. Thiết lập thông số:
   * **Framework Preset:** `Vite`
   * **Root Directory:** `Frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
3. Thêm biến môi trường:
   * **Key:** `VITE_API_BASE_URL`
   * **Value:** `https://caythue-test.onrender.com/api`
   * **Type:** `Config` *(Lưu ý: Không chọn Secret)*
4. Nhấn **Deploy**.

---

## 🧪 Tài Khoản Mẫu Đăng Nhập (Mặc Định Sau Khi Seed)

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **Quản Trị Viên (Admin)** | `admin@caygame.vn` | `Admin@123456` | Toàn quyền quản trị đơn, duyệt cày, upload ảnh, quản lý giá |
| **Khách Hàng (Client)** | `khachhang@gmail.com` | `Khach@123456` | Đặt đơn cày rank, quét mã VietQR, đánh giá dịch vụ |

---

## 📄 Bản Quyền & Giấy Phép

Dự án được phát triển cho mục đích học tập và dịch vụ giải trí thể thao điện tử.
Phát hành theo giấy phép **MIT License**. Mọi quyền đóng góp và phát triển mở rộng đều được hoan nghênh.
