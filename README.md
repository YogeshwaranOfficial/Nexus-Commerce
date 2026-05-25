# 🚀 Nexus Commerce — Production MERN E-Commerce Platform

A full-stack, production-grade e-commerce platform built with modern technologies, featuring a premium UI/UX, real-time updates, role-based authentication, and enterprise-level architecture.

---

## ✨ Features

| Category | Features |
|----------|----------|
| **Auth** | JWT, Refresh tokens, Google/GitHub OAuth, Email OTP, Role-based (User/Seller/Admin) |
| **Shopping** | Product variants, flash sales, cart, wishlist, coupons, multi-address checkout |
| **Payments** | Stripe, Razorpay, Cash on Delivery, Wallet |
| **Real-time** | Socket.io live order tracking, inventory updates, notifications |
| **Dashboards** | User, Seller (analytics, inventory), Admin (full platform control) |
| **Admin** | User management, product moderation, coupon CRUD, category tree, analytics |
| **Email** | Transactional emails via Nodemailer (welcome, OTP, order confirmation) |
| **Upload** | Cloudinary integration, drag & drop, multi-image support |
| **SEO** | Dynamic meta, Open Graph, Twitter cards, canonical URLs |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI/CD, Vercel + Railway/Render deploy |

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS (premium design system)
- Zustand (state management)
- TanStack Query (server state + caching)
- Framer Motion (animations)
- Socket.io Client (real-time)
- Recharts (analytics charts)
- React Hook Form + Zod (validation)

### Backend
- Node.js + Express.js + TypeScript
- MongoDB + Mongoose
- JWT + Passport (OAuth)
- Socket.io
- Cloudinary (media)
- Nodemailer (email)
- Stripe + Razorpay (payments)
- Helmet, Rate Limiting, CORS (security)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- npm 10+

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/nexus-commerce.git
cd nexus-commerce

# Backend
cd backend && cp .env.example .env
npm install

# Frontend
cd ../frontend && cp .env.example .env
npm install
```

### 2. Configure Environment

**Backend `.env`** — fill in all values from `.env.example`:
- MongoDB URI
- JWT secrets (min 32 chars)
- Cloudinary credentials
- SMTP credentials
- Stripe + Razorpay keys
- Google + GitHub OAuth credentials

**Frontend `.env`** — set `VITE_API_URL` to your backend URL (leave empty for dev proxy).

### 3. Run Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## 🐳 Docker Deployment

### Build & Run with Docker Compose

```bash
# Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

Services:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

---

## ☁️ Cloud Deployment

### Frontend → Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variables:
   - `VITE_API_URL` = your backend URL
   - `VITE_RAZORPAY_KEY_ID` = your Razorpay public key
4. Deploy. Vercel auto-deploys on every push to `main`.

Alternatively:
```bash
cd frontend && npx vercel --prod
```

### Backend → Railway or Render

**Railway:**
1. Create new project → Deploy from GitHub
2. Set root directory to `backend`
3. Add all environment variables from `.env.example`
4. Railway auto-detects Node.js and runs `npm start`

**Render:**
1. New Web Service → Connect GitHub repo
2. Root directory: `backend`
3. Build command: `npm ci && npm run build`
4. Start command: `node dist/server.js`
5. Add environment variables

### Database → MongoDB Atlas

1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for cloud deployments)
5. Get connection string → set as `MONGO_URI` in backend env

---

## 📁 Project Structure

```
nexus-commerce/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Socket.io, Logger, Passport
│   │   ├── controllers/     # Auth, Product, Order, Payment, ...
│   │   ├── middleware/      # Auth, Error handler, Validate, ...
│   │   ├── models/          # User, Product, Order, Cart, ...
│   │   ├── routes/          # All API routes
│   │   ├── services/        # Email, Upload
│   │   ├── utils/           # JWT, AppError, slugify
│   │   └── server.ts
│   ├── Dockerfile
│   ├── ecosystem.config.js  # PM2
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Modal, DataTable, Toast, ...
│   │   │   ├── layout/      # Navbar, Footer, Layouts
│   │   │   ├── cart/        # CartDrawer
│   │   │   └── product/     # ProductCard
│   │   ├── pages/
│   │   │   ├── admin/       # Full admin dashboard
│   │   │   ├── seller/      # Seller dashboard
│   │   │   ├── user/        # User account pages
│   │   │   ├── auth/        # All auth pages
│   │   │   └── product/     # Product listing & detail
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API service layer
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helpers
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── .github/workflows/ci-cd.yml
```

---

## 🔐 User Roles

| Role | Access |
|------|--------|
| **User** | Shop, cart, checkout, orders, wishlist, profile |
| **Seller** | All user access + seller dashboard, add/manage products, orders |
| **Admin** | Full platform control — users, products, orders, analytics, settings |

---

## 📡 API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Products | `/api/products` |
| Categories | `/api/categories` |
| Cart | `/api/cart` |
| Orders | `/api/orders` |
| Payments | `/api/payments` |
| Reviews | `/api/reviews` |
| Coupons | `/api/coupons` |
| Wishlist | `/api/wishlist` |
| Search | `/api/search` |
| Upload | `/api/upload` |
| Notifications | `/api/notifications` |
| Admin | `/api/admin` |
| Seller | `/api/seller` |

---

## 🔑 GitHub Secrets Required

For CI/CD to work, add these secrets in your GitHub repository settings:

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RENDER_API_KEY
RENDER_SERVICE_ID
VITE_API_URL
```

---

## 📊 Database Seeding

```bash
cd backend && npm run seed
```

This creates:
- 1 Admin user (admin@nexus.com / Admin@1234)
- 1 Seller user (seller@nexus.com / Seller@1234)
- Sample categories
- Sample products

---

## 🏗️ Production Checklist

- [ ] All environment variables set
- [ ] MongoDB Atlas configured with backups enabled
- [ ] Cloudinary account set up
- [ ] SMTP credentials verified
- [ ] Stripe/Razorpay webhooks configured
- [ ] OAuth app credentials set (Google, GitHub)
- [ ] CORS origins updated for production domain
- [ ] SSL/TLS configured (Vercel/Railway handle this automatically)
- [ ] Rate limiting tuned for production load
- [ ] Error logging service connected (e.g., Sentry)
- [ ] MongoDB indexes verified
- [ ] PM2 or Docker health checks active

---

## 📄 License

MIT — free for personal and commercial use.
