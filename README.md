# 🚀 Nexus Commerce — Production MERN E-Commerce Platform

A modern, full-stack, production-ready e-commerce platform built using the MERN stack with TypeScript, real-time capabilities, secure authentication, role-based access control, advanced shopping workflows, and enterprise-grade architecture.

---

## 🌐 Live Demo

| Service                  | URL                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Frontend (Vercel)**    | [Nexus Commerce Frontend](https://nexus-commerce-2026.vercel.app/?utm_source=chatgpt.com)             |
| **Backend API (Render)** | [Nexus Commerce Backend API](https://nexus-commerce-backend-yhqp.onrender.com?utm_source=chatgpt.com) |

---

## ✨ Key Features

| Category                 | Features                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **Authentication**       | JWT Authentication, Refresh Tokens, Google OAuth, GitHub OAuth, Email OTP Verification |
| **Authorization**        | Role-Based Access Control (User, Seller, Admin)                                        |
| **Shopping**             | Product Variants, Flash Sales, Cart, Wishlist, Coupons, Multi-Address Checkout         |
| **Payments**             | Stripe, Razorpay, Cash on Delivery, Wallet Support                                     |
| **Real-Time**            | Socket.io Notifications, Live Order Updates, Inventory Sync                            |
| **Dashboards**           | User Dashboard, Seller Analytics Dashboard, Admin Management Dashboard                 |
| **Admin Panel**          | User Management, Product Moderation, Category Management, Coupon CRUD                  |
| **Media Uploads**        | Cloudinary Integration with Multi-Image Upload Support                                 |
| **Security**             | Helmet, CORS, Rate Limiting, Secure JWT Handling                                       |
| **DevOps**               | Docker, Docker Compose, GitHub Actions CI/CD, Vercel + Render Deployment               |
| **Developer Experience** | TypeScript, Modular Architecture, Reusable APIs, Clean Folder Structure                |

---

# 🛠️ Tech Stack

## Frontend

* React 18
* Vite
* TypeScript
* Tailwind CSS
* Zustand
* TanStack Query
* Framer Motion
* Socket.io Client
* Recharts
* React Hook Form + Zod

## Backend

* Node.js
* Express.js
* TypeScript
* MongoDB + Mongoose
* Passport.js
* JWT Authentication
* Socket.io
* Cloudinary
* Nodemailer
* Stripe + Razorpay

---

# 📁 Project Structure

```bash
nexus-commerce/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.ts
│   │
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml
└── .github/workflows/
```

---

# 🚀 Getting Started

## Prerequisites

* Node.js 20+
* npm 10+
* MongoDB Atlas or Local MongoDB
* Cloudinary Account
* Stripe/Razorpay Account

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/nexus-commerce.git
cd nexus-commerce
```

---

## 2️⃣ Backend Setup

```bash
cd backend
cp .env.example .env
npm install
```

Configure all environment variables inside `.env`

### Required Backend Environment Variables

```env
PORT=
NODE_ENV=
MONGO_URI=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

STRIPE_SECRET_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

---

## 3️⃣ Frontend Setup

```bash
cd ../frontend
cp .env.example .env
npm install
```

### Required Frontend Environment Variables

```env
VITE_API_URL=https://nexus-commerce-backend-yhqp.onrender.com
VITE_RAZORPAY_KEY_ID=your_key
```

---

# ▶️ Run Locally

## Backend

```bash
cd backend
npm run dev
```

## Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# 🐳 Docker Setup

## Run Using Docker Compose

```bash
docker compose up -d --build
```

## Stop Containers

```bash
docker compose down
```

---

# ☁️ Deployment

## Frontend Deployment — Vercel

* Root Directory: `frontend`
* Build Command:

```bash
npm run build
```

* Output Directory:

```bash
dist
```

### Required Environment Variables

```env
VITE_API_URL=https://nexus-commerce-backend-yhqp.onrender.com
```

---

## Backend Deployment — Render

### Build Command

```bash
npm install && npm run build
```

### Start Command

```bash
npm start
```

### Root Directory

```bash
backend
```

---

# 🔐 User Roles

| Role       | Permissions                                      |
| ---------- | ------------------------------------------------ |
| **User**   | Browse products, add to cart, checkout, wishlist |
| **Seller** | Manage products, inventory, orders               |
| **Admin**  | Full platform management and analytics           |

---

# 📡 API Modules

| Module        | Endpoint             |
| ------------- | -------------------- |
| Auth          | `/api/auth`          |
| Users         | `/api/users`         |
| Products      | `/api/products`      |
| Categories    | `/api/categories`    |
| Cart          | `/api/cart`          |
| Orders        | `/api/orders`        |
| Payments      | `/api/payments`      |
| Wishlist      | `/api/wishlist`      |
| Reviews       | `/api/reviews`       |
| Upload        | `/api/upload`        |
| Notifications | `/api/notifications` |
| Admin         | `/api/admin`         |
| Seller        | `/api/seller`        |

---

# 🔄 CI/CD Pipeline

Configured using GitHub Actions for:

* Automated Build
* TypeScript Validation
* Frontend Deployment
* Backend Deployment
* Continuous Integration

---

# 📊 Features Implemented

* ✅ Authentication & Authorization
* ✅ Protected Routes
* ✅ Product Variants
* ✅ Cart & Wishlist
* ✅ Coupon System
* ✅ Cloudinary Image Upload
* ✅ Address Management
* ✅ Seller Dashboard
* ✅ Admin Dashboard
* ✅ Real-Time Notifications
* ✅ Responsive UI
* ✅ Secure APIs
* ✅ Production Deployment

---

# 🧠 Skills Demonstrated

* Full Stack Development
* MERN Stack Architecture
* REST API Design
* Authentication & Authorization
* State Management
* Real-Time Communication
* Cloud Deployment
* Docker & CI/CD
* TypeScript Backend Development
* Production-Level Project Structuring

---

# 🏗️ Production Highlights

* Enterprise-Level Folder Structure
* Modular Architecture
* Type-Safe Backend APIs
* Reusable Frontend Components
* Secure Authentication Flow
* Optimized API Communication
* Scalable Codebase Design

---

# 📄 License

MIT License © 2026

---

# 👨‍💻 Author

Developed by Yogeshwaran S

---

