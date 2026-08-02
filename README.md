# KTD-Store

> **KTD-Store** — Nền tảng thương mại điện tử thời trang nam (MenWear Hub), xây dựng với React + NestJS + PostgreSQL.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Query |
| Backend | NestJS 10, TypeORM, Passport JWT |
| Database | PostgreSQL (Neon) |
| Realtime | Socket.IO |
| Testing | Vitest, Playwright |

## Features

- 🛍️ Product catalog với variants (size, màu sắc)
- 🛒 Cart & Checkout (COD / QR Payment)
- 📦 Order management & tracking
- 👤 Customer account + wishlist + address book
- 🔐 Admin dashboard (catalog, orders, staff, reports, discounts, returns)
- 🔔 Real-time notifications (WebSocket)
- 💬 AI chat widget (customer support)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Setup

```bash
# Clone repo
git clone https://github.com/iNuss99/KTD-STORE.git
cd KTD-STORE

# Install dependencies
npm install
npm --prefix backend install
npm --prefix frontend install

# Configure environment
cp backend/.env.example backend/.env
# → Edit backend/.env with your DB credentials and JWT secrets

# Run development
npm run dev
```

App runs at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Production Build

```bash
npm run build
# Frontend dist → frontend/dist/
# Backend dist  → backend/dist/
```

## Project Structure

```
KTD-Store/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── modules/  # Auth, Products, Orders, Users, ...
│   │   └── main.ts
│   └── .env.example  # Environment template
├── frontend/         # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── vite.config.ts
└── docker-compose.yml
```

## License

Private — All rights reserved.
