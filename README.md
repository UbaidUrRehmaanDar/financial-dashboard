# MarketIQ — Financial Dashboard

A full-stack financial dashboard for tracking stocks, managing portfolios, and analyzing market data in real-time. Built with React, Vite, and Supabase.

---

## Features

- **Real-Time Stock Quotes** — Live price updates via Finnhub WebSocket
- **Market Overview** — Sector performance, top gainers/losers, major indices
- **Portfolio Tracker** — Add holdings, monitor live P&L, view asset allocation
- **Watchlist** — Track favorite stocks with real-time price simulation
- **Interactive Charts** — Line, area, and bar charts with configurable time ranges
- **AI Stock Analysis** — GPT-4o-mini powered analysis with mock fallback
- **Price Alerts** — Browser-based alerts for price thresholds
- **Dark/Light Theme** — CSS variable-driven theming with system preference support
- **PDF Export** — Export portfolio and analysis data as PDF reports
- **Responsive Design** — Mobile-first layout with floating glassmorphic navigation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, Tailwind CSS 3.4 |
| Animation | Framer Motion 12 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| Market Data | Finnhub API (REST + WebSocket) |
| AI Analysis | OpenAI GPT-4o-mini |
| PDF Export | jsPDF |
| Validation | Zod 4 |
| Backend | Vercel Serverless Functions (Node.js 18+) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (for auth and database)
- A [Finnhub](https://finnhub.io) API key (for market data)
- An [OpenAI](https://platform.openai.com) API key (optional, for AI analysis)

### Installation

```bash
git clone <your-repo-url>
cd BNU2
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
FINNHUB_KEY=your_finnhub_api_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

### Database Setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor to create the required tables:

- `portfolio` — User stock holdings
- `watchlist` — User stock watchlist
- `price_cache` — Shared price cache (JSONB)

All tables have Row Level Security enabled. Users can only access their own data.

### Development

```bash
npm run dev
```

The dev server runs on `http://localhost:5173` with API requests proxied to `http://localhost:3000`.

### Build

```bash
npm run build
```

Output is written to `dist/`.

### Lint

```bash
npm run lint
```

---

## Project Structure

```
├── api/                          # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.js              # POST /api/auth/login
│   │   └── register.js           # POST /api/auth/register
│   ├── market/
│   │   ├── _shared.js            # CORS, validation, caching utilities
│   │   ├── quote.js              # GET /api/market/quote?symbol=AAPL
│   │   ├── overview.js           # GET /api/market/overview
│   │   └── history.js            # GET /api/market/history?symbol=AAPL&range=1M
│   ├── ai/
│   │   └── analyze.js            # POST /api/ai/analyze
│   ├── portfolio.js              # GET/POST/DELETE /api/portfolio
│   └── watchlist.js              # GET/POST/DELETE /api/watchlist
├── src/                          # Frontend React application
│   ├── main.jsx                  # Entry point
│   ├── App.jsx                   # Hash-based router
│   ├── index.css                 # Global styles, Tailwind, theming
│   ├── pages/
│   │   ├── LandingPage.jsx       # Public marketing page
│   │   ├── Auth.jsx              # Login / Sign up
│   │   ├── MarketOverview.jsx    # Sector performance, indices
│   │   ├── StockDetail.jsx       # Stock search + detail view
│   │   ├── Portfolio.jsx         # Holdings with P&L + analytics
│   │   ├── Watchlist.jsx         # Watchlist with live prices
│   │   ├── Charts.jsx            # Multi-chart analytics
│   │   ├── Settings.jsx          # Profile, preferences, security
│   │   └── Alerts.jsx            # Price alert management
│   ├── components/
│   │   ├── AuthGate.jsx          # Auth guard
│   │   ├── DebugPanel.jsx        # Dev debug overlay (Ctrl+D)
│   │   ├── Logo.jsx              # SVG logo
│   │   ├── PageTransition.jsx    # Framer Motion transitions
│   │   └── ui/                   # Reusable primitives (button, card, table, etc.)
│   ├── hooks/
│   │   ├── useMarketQuote.js     # Fetches quotes with fallback
│   │   ├── useLivePrice.js       # WebSocket real-time prices
│   │   └── useTheme.js           # Dark/light toggle with localStorage
│   ├── layouts/
│   │   └── DashboardShell.jsx    # App shell with floating nav
│   ├── lib/
│   │   ├── supabase.js           # Supabase client init
│   │   ├── util.js               # cn() helper (clsx + tailwind-merge)
│   │   └── fixRLS.sql            # SQL script for RLS policies
│   └── assets/
│       ├── hero.png
│       └── ...
├── supabase/
│   └── schema.sql                # Database schema
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── vite.config.js
├── tailwind.config.js
├── vercel.json
└── package.json
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/register` | POST | User registration |
| `/api/market/quote` | GET | Single stock quote (60s cache) |
| `/api/market/overview` | GET | Market overview data (300s cache) |
| `/api/market/history` | GET | Historical candle data (600s cache) |
| `/api/portfolio` | GET/POST/DELETE | Portfolio CRUD |
| `/api/watchlist` | GET/POST/DELETE | Watchlist CRUD |
| `/api/ai/analyze` | POST | AI stock analysis |

---

## Database Schema

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `portfolio` | User stock holdings | `id`, `user_id`, `symbol`, `quantity`, `buy_price`, `buy_date` |
| `watchlist` | User watchlist entries | `id`, `user_id`, `symbol`, `company_name`, `added_at` |
| `price_cache` | Shared price cache | `symbol`, `data` (JSONB), `cached_at` |

All tables enforce Row Level Security — users can only read/write their own records.

---

## Deployment

The project is configured for [Vercel](https://vercel.com):

```bash
npx vercel
```

`vercel.json` handles API route rewrites and build configuration automatically.

---

## License

This project is private and not currently licensed for public use.
