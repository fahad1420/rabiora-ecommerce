# Rabiora E-Commerce

Rabiora is a modern, high-performance Pakistani luxury three-piece fashion storefront and full-stack e-commerce application tailored for Bangladesh and global shoppers. Built with **React 19**, **Vite 7**, **TypeScript**, **Tailwind CSS 4**, **Express**, **tRPC**, and **MongoDB (Mongoose)**.

---

## ✨ Features & Architecture

### 🛍️ Storefront & User Experience
- **Luxury Product Showcase**: Curated catalogue for Pakistani three-piece collections (Luxury Lawn, Swiss Cotton, Silk & Organza, Casual Wear).
- **Interactive 3D Featured Carousel**: Smooth 3D stage rotation with 2-second auto-slide, touch swipe support, and instant product prefetching.
- **Dynamic Flash Sale Manager**: Real-time ticking countdown timer, discount banners, and admin-curated flash sale product cards with live stock indicators.
- **Continuous Announcement Marquee**: Seamless right-to-left marquee ticker with gradient masks, pause on hover/touch, and dynamic announcement management.
- **Instant Search Drawer**: Full-screen mobile & desktop search modal with automatic focus, iOS auto-zoom prevention, quick category chips, and live product search results.
- **Rock-Solid Mobile App Navbar**: Hardware-composited, React Portal-mounted bottom navigation bar specifically engineered for iOS Safari dynamic viewport stability and `env(safe-area-inset-bottom)` notch support across all iPhone and Android devices.
- **Zero-Lag Product Detail Page**: Instant 0ms page transitions powered by React Query cache prefetching and synchronous placeholder seeding.
- **Bangladesh-Specific Checkout**: Complete delivery area hierarchy (Dhaka City vs Outside Dhaka, District & Upazila/Thana cascading dropdowns) with automatic shipping calculation.
- **Payment & Order Handoff**:
  - Cash on Delivery (COD)
  - bKash, Nagad, Rocket mobile wallet integration
  - 1-tap Click-to-WhatsApp direct order handoff (`wa.me`)
- **Customer Accounts & Order Tracking**: Secure login, registration, order history tracking, and wishlist synchronization.
- **Customer Reviews & Ratings**: Verified customer product reviews with star ratings and feedback display.
- **VIP Discount & Newsletter Modal**: First-order discount lead capture modal and subscriber management.

---

### 🛡️ Administration Dashboard
- **Theme Engine**: Complete Dark/Light mode support across all admin and storefront pages.
- **Product Management**: Full CRUD for catalogue products, multi-image upload galleries, SKU, pricing, compare-at pricing, and stock controls.
- **Featured Collection Manager**: 3D carousel curation and slot ordering.
- **Flash Sale Manager**: Live timer expiration configuration and active product assignment.
- **Announcements Manager**: Add, edit, reorder, and toggle storefront marquee banners.
- **Orders & Customer CRM**: Real-time order status tracking (Pending, Processing, Shipped, Delivered, Cancelled) and customer profiles.
- **Promotions & Coupons**: Dynamic discount codes with subtotal thresholds and validity rules.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 7, Wouter, TanStack Query (React Query v5), Tailwind CSS 4, Lucide Icons, Sonner |
| **Backend API** | Node.js, Express, tRPC (End-to-End Type Safety), Zod |
| **Database & Models** | MongoDB, Mongoose ODM |
| **Authentication** | Secure JWT Session Cookies, bcrypt password hashing, Role-Based Access Control (`admin` / `customer`) |
| **Styling & Design System** | Custom CSS Design System with dark mode variables, CSS Grid, 3D Perspective, and iOS Safe-Area support |
| **Build & Bundler** | Vite (Client), ESBuild (Server bundle) |

---

## 📂 Project Structure

```text
rabiora-ecommerce/
├── client/                     # Frontend React application
│   ├── public/                 # Static assets, branding, favicons
│   ├── src/
│   │   ├── components/         # Header, Footer, 3D Carousel, Search, Flash Sale, Mobile Nav
│   │   ├── contexts/           # ThemeContext, LanguageContext
│   │   ├── hooks/              # useRabioraCart, useRabioraWishlist
│   │   ├── lib/                # tRPC client, query utils
│   │   ├── pages/              # Home, ProductDetail, Cart, Wishlist, Checkout, Account, Admin
│   │   ├── App.tsx             # Root router, providers, and global portals
│   │   └── index.css           # Global stylesheet & design tokens
├── server/                     # Backend Express & tRPC server
│   ├── config/                 # Database connection (connectMongo)
│   ├── models/                 # Mongoose models (Product, Order, Customer, FlashSale, etc.)
│   ├── routers/                # tRPC route handlers (Admin, Customer, Order, Wishlist)
│   ├── catalogue.ts            # Catalogue querying & search logic
│   ├── flashSaleService.ts     # Flash sale management & active status
│   ├── announcementService.ts  # Announcement banner engine
│   ├── couponService.ts        # Promo code validation logic
│   ├── routers.ts              # Root tRPC AppRouter
│   └── app.ts                  # Server initialization & middleware
├── uploads/                    # Local media storage for products and branding
├── drizzle/                    # Legacy migration schema references
├── package.json                # Dependencies and scripts
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.x or v22.x
- **pnpm**: v10.x (or npm / yarn)
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster connection URI

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/fahad1420/rabiora-ecommerce.git
cd rabiora-ecommerce
pnpm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rabiora?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. Development Mode
Start the development server with live reload:
```bash
pnpm dev
```
The application will be accessible at `http://localhost:3000`.

---

## 🔨 Available Scripts

| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Starts Vite and Express in development mode with HMR |
| `pnpm check` | Runs full TypeScript type verification (`tsc --noEmit`) |
| `pnpm build` | Builds the client bundle into `dist/public` and bundles backend into `dist/index.js` |
| `pnpm start` | Runs the compiled production server (`node dist/index.js`) |
| `pnpm test` | Runs the test suite |

---

## 📦 Production Deployment

1. **Build Production Artifacts**:
   ```bash
   pnpm run check
   pnpm run build
   ```
2. **Environment Variables**: Ensure `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`, and `PORT` are configured in your hosting platform.
3. **Start Application**:
   ```bash
   pnpm start
   ```

---

## 📄 License & Attribution

- **Brand**: Rabiora Bangladesh
- **Design & Development**: Developed by [FIAUS Tech](https://www.fiaus.com)
- **Copyright**: © 2026 Rabiora. All rights reserved.
