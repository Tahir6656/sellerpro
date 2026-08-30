# SellerPro

A modern, full-stack web application for managed selling plans, secure payments, withdrawals, referrals, and admin management.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion
- **Backend:** Next.js API Routes
- **Database:** SQLite (development) via Prisma ORM
- **Auth:** JWT sessions with HTTP-only cookies, bcrypt password hashing
- **Real-time:** Server-Sent Events (SSE) for configuration updates

## Features

- Public landing page with configurable content
- User registration & login (mobile + password)
- Forgot password with admin approval workflow
- User dashboard with balance, plans, and notifications
- Plan activation with payment proof upload
- Withdrawal requests (EasyPaisa, JazzCash)
- Referral system with tree visualization
- Separate admin panel (server-side protected)
- Payment/withdrawal approval workflows
- Transaction ledger & audit logs
- Maintenance mode
- Real-time config updates via SSE

## Getting Started

### Prerequisites

- Node.js 20+ (22.13+ recommended)
- npm

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Create database and seed initial data
npm run db:setup
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Admin Credentials

After seeding, use these credentials (change in production):

| Field    | Value                |
|----------|----------------------|
| Email    | admin@sellerpro.com  |
| Mobile   | 03351999093          |
| Password | @Tahir6640           |

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma database URL | `file:./dev.db` |
| `JWT_SECRET` | JWT signing secret (min 32 chars in production) | — |
| `JWT_EXPIRES_IN` | Session expiry | `7d` |
| `ADMIN_EMAIL` | Seed admin email | `admin@sellerpro.com` |
| `ADMIN_PASSWORD` | Seed admin password | `@Tahir6640` |
| `ADMIN_MOBILE` | Seed admin mobile | `03351999093` |
| `REFERRAL_REWARD_AMOUNT` | Default referral reward | `50` |
| `PASSWORD_RESET_CODE_EXPIRY_MINUTES` | Reset code expiry | `30` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |

## Database Commands

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # Seed initial data
npm run db:setup      # Push + seed
```

## Production Deployment

### 1. Database

For production, switch to PostgreSQL in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Environment

Set all environment variables with secure values:

- Use a strong `JWT_SECRET` (32+ random characters)
- Set `NEXT_PUBLIC_APP_URL` to your domain
- Change default admin credentials immediately

### 3. Build & Start

```bash
npm run build
npm start
```

### 4. HTTPS

Deploy behind HTTPS (Vercel, Railway, VPS with nginx/Caddy). Cookies are marked `secure` in production.

### 5. File Uploads

Payment screenshots are stored in `public/uploads/`. For production, consider moving to S3 or similar object storage.

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes (auth, user, admin, config)
│   ├── admin/        # Admin panel pages
│   ├── dashboard/    # User dashboard pages
│   ├── login/        # Auth pages
│   └── page.tsx      # Landing page
├── components/ui/    # Reusable UI components
├── hooks/            # Client hooks
└── lib/              # Server utilities (auth, db, transactions)
prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Seed data
```

## Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- Admin routes protected by middleware + server-side role checks
- Rate limiting on auth endpoints
- File upload validation (type & size)
- Immutable transaction ledger
- Admin audit logging
- Maintenance mode bypasses only for admin role

## License

Private — All rights reserved.
