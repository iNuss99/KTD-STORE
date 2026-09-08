# 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN KTD-STORE TRÊN MÁY MỚI (CHI TIẾT TỪ A - Z)

Tài liệu này hướng dẫn chi tiết từng bước để thiết lập và khởi chạy toàn bộ hệ thống **KTD-Store (MenWear Hub)** trên một máy tính hoàn toàn mới (Windows, macOS hoặc Linux).

---

## 📑 Mục Lục
1. [Yêu Cầu Phần Mềm Trước Khi Cài Đặt (Prerequisites)](#1-yêu-cầu-phần-mềm-trước-khi-cài-đặt-prerequisites)
2. [Tải Mã Nguồn Về Máy (Clone Repository)](#2-tải-mã-nguồn-về-máy-clone-repository)
3. [Phương Pháp 1: Chạy 1-Click Bằng Docker (Khuyên Dùng - Nhanh Nhất)](#3-phương-pháp-1-chạy-1-click-bằng-docker-khuyên-dùng---nhanh-nhất)
4. [Phương Pháp 2: Chạy Thủ Công Trên Máy (Dành Cho Lập Trình Viên)](#4-phương-pháp-2-chạy-thủ-công-trên-máy-dành-cho-lập-trình-viên)
5. [Thông Tin Đăng Nhập & Đường Dẫn Truy Cập](#5-thông-tin-đăng-nhập--đường-dẫn-truy-cập)
6. [Các Lệnh Tiện Ích Thường Dùng](#6-các-lệnh-tiện-ích-thường-dùng)
7. [Khắc Phục Sự Cố Thường Gặp (Troubleshooting)](#7-khắc-phục-sự-cố-thường-gặp-troubleshooting)

---

## 1. Yêu Cầu Phần Mềm Trước Khi Cài Đặt (Prerequisites)

Hãy đảm bảo máy tính mới của bạn đã cài đặt các công cụ sau:

| Phần mềm | Phiên bản khuyến nghị | Mục đích | Link tải chính thức |
| :--- | :--- | :--- | :--- |
| **Git** | Mới nhất | Kéo mã nguồn từ GitHub | [git-scm.com](https://git-scm.com/) |
| **Docker Desktop** | Mới nhất | Chạy Postgres, Redis, MinIO (hoặc toàn bộ web) | [docker.com](https://www.docker.com/) |
| **Node.js** *(chỉ cần cho PP2)* | v18.x hoặc v20.x LTS | Môi trường chạy backend và frontend cục bộ | [nodejs.org](https://nodejs.org/) |

> ⚠️ **Lưu ý quan trọng đối với Docker trên Windows**:
> - Hãy đảm bảo đã bật **Docker Desktop** trước khi chạy bất kỳ lệnh Docker nào (biểu tượng cá voi màu xanh lá cây ở thanh taskbar báo *Engine running*).
> - Nếu Docker Desktop yêu cầu WSL2, hãy làm theo hướng dẫn hiển thị trên màn hình để cài đặt WSL2 Linux Kernel.

---

## 2. Tải Mã Nguồn Về Máy (Clone Repository)

Mở **Terminal** (macOS/Linux) hoặc **PowerShell / Command Prompt** (Windows) và chạy:

```bash
# 1. Di chuyển tới thư mục bạn muốn lưu dự án (ví dụ Desktop hoặc ổ D/E)
cd E:\

# 2. Clone mã nguồn từ GitHub
git clone https://github.com/iNuss99/KTD-STORE.git

# 3. Đi vào thư mục dự án
cd KTD-STORE
```

---

## 3. Phương Pháp 1: Chạy 1-Click Bằng Docker (Khuyên Dùng - Nhanh Nhất)

Đây là cách đơn giản và an toàn nhất. **Bạn thậm chí không cần cài đặt Node.js hay npm trên máy**. Toàn bộ 5 thành phần (Database, Cache, Object Storage, Backend API, Frontend React) sẽ được đóng gói và khởi chạy tự động.

### Bước 3.1: Khởi động hệ thống
Tại thư mục gốc `KTD-STORE`, chạy lệnh:
```bash
docker compose up -d --build
```

Docker sẽ tự động:
1. Tải image PostgreSQL 15, Redis 7, MinIO S3.
2. Build mã nguồn NestJS Backend (tự động chạy TypeORM Migration khởi tạo database và seed tài khoản Admin).
3. Build mã nguồn React Frontend và đưa vào Web Server Nginx Alpine.
4. Thiết lập mạng nội bộ liên kết tất cả dịch vụ với nhau.

### Bước 3.2: Kiểm tra trạng thái
Kiểm tra xem các container đã chạy thành công chưa:
```bash
docker compose ps
```
Bạn sẽ thấy 5 container đều ở trạng thái `running` (hoặc `healthy`):
- `menwear_postgres`
- `menwear_redis`
- `menwear_minio`
- `menwear_backend`
- `menwear_frontend`

### Bước 3.3: Truy cập vào ứng dụng
- **Giao diện Khách hàng & Admin**: [http://localhost](http://localhost) (hoặc [http://localhost:5173](http://localhost:5173))
- **Trang Đăng Nhập Quản Trị**: [http://localhost/admin/login](http://localhost/admin/login)
- **Backend API Swagger**: [http://localhost:3000](http://localhost:3000)
- **Trình Quản Lý Ảnh MinIO S3**: [http://localhost:9001](http://localhost:9001)

### Bước 3.4: Khi muốn dừng hoặc tắt hệ thống
```bash
# Dừng hệ thống (dữ liệu database trong volume vẫn được giữ nguyên an toàn)
docker compose down

# Nếu muốn xóa sạch toàn bộ cả dữ liệu database để tạo lại từ đầu
docker compose down -v
```

---

## 4. Phương Pháp 2: Chạy Thủ Công Trên Máy (Dành Cho Lập Trình Viên)

Phương pháp này thích hợp khi bạn muốn can thiệp trực tiếp vào mã nguồn TypeScript, có tính năng **Hot Reload (sửa code là màn hình tự cập nhật ngay)**.

### Bước 4.1: Cài đặt Dependencies cho toàn bộ dự án
Dự án được cấu trúc dạng monorepo chuẩn gồm root, backend và frontend. Cần cài đặt thư viện cho cả 3:

```bash
# 1. Cài đặt thư viện tại thư mục gốc
npm install

# 2. Cài đặt thư viện cho Backend
cd backend
npm install
cd ..

# 3. Cài đặt thư viện cho Frontend
cd frontend
npm install
cd ..
```

---

### Bước 4.2: Cấu hình biến môi trường (`.env`)
Tạo file `.env` bên trong thư mục `backend/`:

* Trên **Windows PowerShell**:
  ```powershell
  Copy-Item backend\.env.example backend\.env
  ```
* Trên **macOS / Linux**:
  ```bash
  cp backend/.env.example backend/.env
  ```

Nội dung chuẩn của file `backend/.env` (sử dụng Docker cục bộ):
```env
# Server
PORT=3000
NODE_ENV=development

# Database PostgreSQL cục bộ
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgrespassword
DB_NAME=menwear_db
DB_SSL=false

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Bảo mật
JWT_SECRET=ktd-store-super-secret-jwt-key-min-32-chars
JWT_EXPIRATION=8h
JWT_REFRESH_SECRET=ktd-store-super-secret-refresh-jwt-key-min-32-chars
JWT_REFRESH_EXPIRATION=7d

# Cổng Frontend
FRONTEND_URL=http://localhost:5173
```

*(Ghi chú: Nếu bạn sử dụng cơ sở dữ liệu đám mây như **Neon PostgreSQL**, chỉ cần dán thông tin `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` từ Neon và đặt `DB_SSL=true`).*

---

### Bước 4.3: Khởi chạy Database & Redis bằng Docker
Thay vì cài đặt PostgreSQL và Redis thủ công vào hệ điều hành, bạn dùng Docker để chạy ngầm:
```bash
docker compose up -d postgres redis minio
```

---

### Bước 4.4: Khởi tạo bảng dữ liệu (Run Migrations)
Chạy lệnh sau để TypeORM tự động tạo toàn bộ cấu trúc bảng và seed tài khoản Super Admin:
```bash
npm --prefix backend run migration:run
```

*(Tùy chọn) Nếu muốn nạp thêm đơn hàng và số liệu thống kê mẫu để kiểm tra báo cáo doanh thu:*
```bash
npm --prefix backend run seed:mock-orders
```

---

### Bước 4.5: Khởi chạy ứng dụng
Tại thư mục gốc `KTD-STORE`, chỉ cần chạy đúng **1 lệnh**:
```bash
npm start
```
*(Hoặc `npm run dev`)*

Lệnh này sẽ tự động bật đồng thời cả Backend (port 3000) và Frontend (port 5173).

---

## 5. Thông Tin Đăng Nhập & Đường Dẫn Truy Cập

### 👑 Tài khoản Quản Trị Viên (Super Admin)
- **Đường dẫn**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login) *(hoặc [http://localhost/admin/login](http://localhost/admin/login))*
- **Email**: `admin@gmail.com`
- **Mật khẩu**: `123`

### 📦 MinIO S3 Console (Quản lý hình ảnh)
- **Đường dẫn**: [http://localhost:9001](http://localhost:9001)
- **Username**: `minioadmin`
- **Password**: `minioadminpassword`

### 👤 Tài khoản Khách hàng
- Bạn có thể đăng ký tài khoản khách hàng mới trực tiếp tại trang chủ [http://localhost:5173](http://localhost:5173) hoặc sử dụng các tài khoản test:
  - `customer@gmail.com` / `123`

---

## 6. Các Lệnh Tiện Ích Thường Dùng

| Lệnh | Vị trí chạy | Tác dụng |
| :--- | :--- | :--- |
| `npm start` | Thư mục gốc | Bật đồng thời cả Backend và Frontend (Hot-reload) |
| `npm run build` | Thư mục gốc | Build kiểm tra lỗi TypeScript cho cả Backend và Frontend |
| `npm --prefix backend test` | Thư mục gốc | Chạy 100+ bài test kiểm thử tự động của Backend |
| `npm --prefix frontend test` | Thư mục gốc | Chạy toàn bộ bài test kiểm thử Vitest của Frontend |
| `npm --prefix backend run seed:mock-orders` | Thư mục gốc | Tự động tạo 10+ đơn hàng mẫu & dữ liệu báo cáo |
| `npm --prefix backend run clean:mock-orders` | Thư mục gốc | Xóa sạch đơn hàng mẫu để kiểm thử từ đầu |
| `docker compose ps` | Thư mục gốc | Xem danh sách và trạng thái các container |
| `docker compose logs -f backend` | Thư mục gốc | Xem log chi tiết của server backend trong Docker |

---

## 7. Khắc Phục Sự Cố Thường Gặp (Troubleshooting)

### 🔴 Lỗi 1: Cổng bị chiếm dụng (Port already in use: 5432 / 3000 / 5173)
- **Nguyên nhân**: Bạn đã có một phần mềm PostgreSQL cài sẵn trên máy đang chạy ở port 5432, hoặc một terminal cũ chưa tắt cổng 3000.
- **Cách xử lý**:
  - *Trên Windows (PowerShell với quyền Admin)*:
    ```powershell
    # Tìm tiến trình đang chiếm cổng 5432
    Get-Process -Id (Get-NetTCPConnection -LocalPort 5432).OwningProcess | Stop-Process -Force
    # Tương tự cho cổng 3000
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
    ```
  - *Trên macOS / Linux*:
    ```bash
    sudo lsof -i :5432
    kill -9 <PID>
    ```

### 🔴 Lỗi 2: "Cannot connect to the Docker daemon"
- **Nguyên nhân**: Ứng dụng Docker Desktop chưa được mở hoặc đang trong trạng thái khởi động.
- **Cách xử lý**: Mở ứng dụng **Docker Desktop** trên máy tính, đợi đến khi góc dưới bên trái hiện chấm màu xanh lá cây rồi chạy lại lệnh.

### 🔴 Lỗi 3: Database báo lỗi kết nối `ECONNREFUSED 127.0.0.1:5432`
- **Nguyên nhân**: Container PostgreSQL chưa khởi động kịp hoặc chưa bật.
- **Cách xử lý**:
  ```bash
  docker compose up -d postgres
  # Chờ 5 giây rồi kiểm tra
  docker compose logs postgres
  ```

### 🔴 Lỗi 4: Xóa sản phẩm hoặc dữ liệu nhưng bị lỗi ràng buộc khóa ngoại
- **Giải pháp**: Dự án đã tích hợp sẵn cơ chế **Atomic Transaction Batch Delete**. Bạn chỉ cần vào trang Admin Catalog, chọn các sản phẩm và nhấn nút *"Xóa các mục đã chọn"*. Hệ thống sẽ tự động gỡ liên kết đơn hàng an toàn mà không ảnh hưởng tới doanh thu.
