# Injective Market Pulse

> **Infrastructure-grade REST API** that transforms raw Injective on-chain data into actionable market intelligence — liquidity depth, volatility, spread analysis, and health scores in developer-friendly JSON.

**Live API**: [https://injective-market-pulse.onrender.com](https://injective-market-pulse.onrender.com) | **Docs**: [https://injective-market-pulse.onrender.com/docs](https://injective-market-pulse.onrender.com/docs)

Built for the **Ninja API Forge** hackathon.

---

## Why This Exists

Injective provides powerful on-chain trading primitives, but developers building DEXs, trading bots, or dashboards must:

1. Initialize multiple gRPC clients (spot, derivatives, bank)
2. Make separate calls per market, per type
3. Manually convert chain-format numbers to human-readable values
4. Compute derived metrics (spread, depth, volatility) from raw arrays
5. Stitch data from different sources together

**Market Pulse eliminates all of that.** One REST call returns normalized, computed market intelligence ready to use.

---

## Quick Start

```bash
git clone https://github.com/z0neSec/injective-market-pulse.git
cd injective-market-pulse
npm install
cp .env.example .env
npm run dev
```

API running at **http://localhost:3000** — Interactive docs at **http://localhost:3000/docs**

---

## Endpoints

### Market Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/markets` | List all markets (spot + derivative) with filters |
| `GET` | `/api/v1/markets/spot` | List all active spot markets |
| `GET` | `/api/v1/markets/derivative` | List all active derivative markets |
| `GET` | `/api/v1/markets/:marketId` | Get details for a specific market |

### Market Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/markets/:marketId/summary` | Full snapshot: market + orderbook + trades + health |
| `GET` | `/api/v1/markets/:marketId/orderbook` | Normalized orderbook with depth & spread metrics |
| `GET` | `/api/v1/markets/:marketId/trades` | Recent trades with volume, volatility, price change |
| `GET` | `/api/v1/markets/:marketId/health` | **Computed health score (0-100) with breakdown** |

### Cross-Market Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analytics/overview` | Ecosystem-wide stats: total markets, volume, avg health |
| `GET` | `/api/v1/analytics/rankings` | Markets ranked by volume, liquidity, health, spread |
| `GET` | `/api/v1/analytics/compare` | **Compare 2-5 markets side-by-side** |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/status` | API health check, uptime, cache stats |

---

## Example Usage

### List all markets (filtered by quote token)

```bash
curl 'http://localhost:3000/api/v1/markets?quote=USDT&type=spot&limit=5'
```

### Get market health score

```bash
curl http://localhost:3000/api/v1/markets/0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef654b12ca7e6031ca0fa/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "marketId": "0x0511...a0fa",
    "ticker": "ATOM/USDT",
    "type": "spot",
    "healthScore": 60,
    "healthGrade": "C",
    "metrics": {
      "liquidity": {
        "score": 17,
        "bidDepthNotional": 42819.55,
        "askDepthNotional": 43298.39,
        "depthImbalance": 0.0056
      },
      "spread": {
        "score": 98,
        "absoluteSpread": 0.002,
        "relativeSpreadBps": 9.46,
        "midPrice": 2.114
      },
      "volatility": {
        "score": 50,
        "recentVolatility": 0.00047,
        "tradeFrequency": 100,
        "avgTradeSize": 12.48
      },
      "activity": {
        "score": 81,
        "recentTrades": 100,
        "recentVolume": 2637.2
      }
    },
    "computedAt": "2026-02-14T00:48:48.751Z"
  },
  "meta": {
    "timestamp": "2026-02-14T00:48:48.751Z",
    "dataFreshness": "30s",
    "source": "injective-mainnet",
    "apiVersion": "v1"
  }
}
```

### Get orderbook with depth metrics

```bash
curl 'http://localhost:3000/api/v1/markets/0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef654b12ca7e6031ca0fa/orderbook?depth=5'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "marketId": "0x0511...a0fa",
    "ticker": "ATOM/USDT",
    "bids": [
      { "price": 2.113, "quantity": 2.86, "total": 2.86, "notional": 6.04 },
      { "price": 2.112, "quantity": 3.03, "total": 5.89, "notional": 6.40 }
    ],
    "asks": [
      { "price": 2.115, "quantity": 3.52, "total": 3.52, "notional": 7.44 },
      { "price": 2.116, "quantity": 3.53, "total": 7.05, "notional": 7.47 }
    ],
    "metrics": {
      "midPrice": 2.114,
      "bestBid": 2.113,
      "bestAsk": 2.115,
      "absoluteSpread": 0.002,
      "relativeSpreadBps": 9.46,
      "bidDepthTotal": 15.97,
      "askDepthTotal": 16.05,
      "bidDepthNotional": 33.71,
      "askDepthNotional": 33.95,
      "depthImbalance": 0.0035
    }
  }
}
```

### Get market rankings

```bash
curl 'http://localhost:3000/api/v1/analytics/rankings?metric=health&limit=5'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "rankings": [
      { "rank": 1, "ticker": "ATOM/USDT", "type": "spot", "value": 60, "metric": "health" },
      { "rank": 2, "ticker": "ORAI/USDT", "type": "spot", "value": 57, "metric": "health" },
      { "rank": 3, "ticker": "stINJ/INJ", "type": "spot", "value": 55, "metric": "health" }
    ],
    "metric": "health",
    "type": "all"
  }
}
```

### Get full market summary (one call = everything)

```bash
curl http://localhost:3000/api/v1/markets/0x9b9980167ecc3645ff1a5517886652d94a0825e54a77d2057cbbe3ebee015963/summary
```

### Compare markets side-by-side

```bash
curl 'http://localhost:3000/api/v1/analytics/compare?markets=0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef654b12ca7e6031ca0fa,0x9b9980167ecc3645ff1a5517886652d94a0825e54a77d2057cbbe3ebee015963'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "markets": [
      {
        "ticker": "ATOM/USDT",
        "midPrice": 2.114,
        "spreadBps": 9.46,
        "liquidityDepth": 86117.94,
        "volume": 2637.2,
        "volatility": 0.00047,
        "healthScore": 60,
        "healthGrade": "C"
      },
      {
        "ticker": "INJ/USDT",
        "midPrice": 12.35,
        "spreadBps": 4.05,
        "liquidityDepth": 125000.5,
        "volume": 15420.8,
        "volatility": 0.0012,
        "healthScore": 72,
        "healthGrade": "B"
      }
    ],
    "bestBySpread": "INJ/USDT",
    "bestByLiquidity": "INJ/USDT",
    "bestByHealth": "INJ/USDT"
  }
}
```

---

## Testing the API

### Quick Start (Local)

```bash
# 1. Start the server
npm run dev

# 2. Open interactive Swagger docs in your browser
open http://localhost:3000/docs
```

### Testing Every Endpoint with curl

Below is a complete set of curl commands to test every endpoint. Replace `BASE` with your server URL.

```bash
BASE=http://localhost:3000

# ── System ────────────────────────────────────────
curl $BASE/api/v1/status | jq

# ── Market Discovery ─────────────────────────────
curl "$BASE/api/v1/markets?limit=5" | jq
curl "$BASE/api/v1/markets?type=spot&quote=USDT&limit=3" | jq
curl "$BASE/api/v1/markets?search=INJ" | jq
curl $BASE/api/v1/markets/spot | jq
curl $BASE/api/v1/markets/derivative | jq

# Pick a market ID from the list above, e.g.:
MKT=0x0511ddc4e6586f3bfe1acb2dd905f8b8a82c97e1edaef654b12ca7e6031ca0fa

curl $BASE/api/v1/markets/$MKT | jq

# ── Market Intelligence ──────────────────────────
curl "$BASE/api/v1/markets/$MKT/orderbook?depth=10" | jq
curl "$BASE/api/v1/markets/$MKT/trades?limit=20" | jq
curl $BASE/api/v1/markets/$MKT/health | jq
curl $BASE/api/v1/markets/$MKT/summary | jq

# ── Analytics ────────────────────────────────────
curl $BASE/api/v1/analytics/overview | jq
curl "$BASE/api/v1/analytics/rankings?metric=health&limit=5" | jq
curl "$BASE/api/v1/analytics/rankings?metric=volume&type=spot&limit=3" | jq
curl "$BASE/api/v1/analytics/rankings?metric=spread&limit=5" | jq

# ── Compare Markets ─────────────────────────────
MKT2=0x9b9980167ecc3645ff1a5517886652d94a0825e54a77d2057cbbe3ebee015963
curl "$BASE/api/v1/analytics/compare?markets=$MKT,$MKT2" | jq

# ── Error Handling (verify proper error responses) ──
curl $BASE/api/v1/markets/0xinvalid | jq         # 400 invalid format
curl "$BASE/api/v1/markets?limit=999" | jq        # 400 out of range
curl $BASE/api/v1/nonexistent | jq                # 404 not found
```

### Testing with the Live API

You can also test against the deployed production API:

```bash
BASE=https://injective-market-pulse.onrender.com

curl $BASE/api/v1/status | jq
curl "$BASE/api/v1/markets?type=spot&limit=3" | jq
curl "$BASE/api/v1/analytics/rankings?metric=health&limit=5" | jq
```

### Interactive Swagger UI

Visit [https://injective-market-pulse.onrender.com/docs](https://injective-market-pulse.onrender.com/docs) to explore all endpoints interactively. You can click "Try it out" on any endpoint to execute it directly from the browser.

---

## Query Parameters

| Endpoint | Parameter | Description |
|----------|-----------|-------------|
| `/markets` | `type` | `spot` or `derivative` |
| `/markets` | `quote` | Filter by quote token (e.g., `USDT`) |
| `/markets` | `search` | Search by ticker substring |
| `/markets` | `limit` | Max results (default: 50) |
| `/markets` | `offset` | Pagination offset |
| `/markets/:id/orderbook` | `depth` | Orderbook levels: 5, 10, 25, 50 |
| `/markets/:id/trades` | `limit` | Number of recent trades (default: 50) |
| `/analytics/rankings` | `metric` | `volume`, `liquidity`, `health`, `spread`, `volatility` |
| `/analytics/rankings` | `type` | `spot` or `derivative` |
| `/analytics/rankings` | `limit` | Number of results (default: 10) |
| `/analytics/compare` | `markets` | Comma-separated market IDs (2-5 required) |

---

## Computed Metrics

These metrics are **not available from Injective directly** — they are computed by Market Pulse:

| Metric | Description | Source |
|--------|-------------|--------|
| **Health Score** (0-100) | Weighted composite of liquidity, spread, volatility, activity | Orderbook + Trades |
| **Health Grade** (A+ to F) | Letter grade from health score | Health Score |
| **Liquidity Depth** (USD) | Total notional depth on each side of the book | Orderbook |
| **Depth Imbalance** (0-1) | How lopsided the orderbook is | Orderbook |
| **Relative Spread** (bps) | Bid-ask spread as basis points of mid price | Orderbook |
| **Realized Volatility** | Standard deviation of log returns | Trade prices |
| **Buy/Sell Ratio** | Ratio of buy to sell trades | Trades |
| **Price Change %** | Price movement in recent window | Trades |

### Health Score Algorithm

```
Health Score = (Liquidity × 0.30) + (Spread × 0.25) + (Volatility × 0.20) + (Activity × 0.25)

Liquidity Score:  Based on total notional depth ($0 → 0, $500K+ → 100), penalized for imbalance
Spread Score:     Tighter spread = higher score (<5 bps → 100, >200 bps → 0)
Volatility Score: Moderate volatility is optimal (sweet spot: 0.005-0.03)
Activity Score:   Based on trade count and notional volume
```

---

## Injective Data Sources

| Source | Used For |
|--------|----------|
| `IndexerGrpcSpotApi` | Spot markets, orderbooks, trades |
| `IndexerGrpcDerivativesApi` | Derivative/perpetual markets, orderbooks, trades |
| Injective Mainnet Indexer | `https://sentry.exchange.grpc-web.injective.network` |

All data is fetched via the official `@injectivelabs/sdk-ts` TypeScript SDK.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    REST API (Fastify)                      │
│  /api/v1/markets  /api/v1/analytics  /api/v1/status       │
├──────────────────────────────────────────────────────────┤
│                    Controllers                            │
│  Request validation → delegate → format response          │
├──────────────────────────────────────────────────────────┤
│                    Services                               │
│  market · orderbook · trades · health · analytics · cache │
│  (business logic, computation, caching)                   │
├──────────────────────────────────────────────────────────┤
│                    Clients                                │
│  Injective SDK (spotApi, derivativeApi)                   │
├──────────────────────────────────────────────────────────┤
│                Injective Blockchain                       │
│  Mainnet Indexer (gRPC-Web)                               │
└──────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Layered architecture**: Clients → Services → Controllers → Routes — clean separation of concerns
- **In-memory caching with stale fallback**: TTL-based cache per data type (10-60s); on upstream failure, serves last-known-good data
- **Consistent response envelope**: Every response has `success`, `data`, `meta` fields
- **Structured error handling**: Custom error classes with HTTP codes and error codes
- **Input validation**: Centralized parameter validation with bounds checking and meaningful error messages
- **Security headers**: `@fastify/helmet` adds HSTS, X-Content-Type-Options, etc.
- **Response compression**: `@fastify/compress` with 1KB threshold reduces payload sizes
- **Rate limiting**: 100 req/min per IP with proper 429 responses
- **Response headers**: `X-Response-Time` and `X-Request-Id` on every response for debugging
- **Graceful shutdown**: Handles SIGTERM/SIGINT for clean container deployments
- **OpenAPI/Swagger**: Full response schemas on all endpoints — interactive docs at `/docs`
- **Versioned API**: `/api/v1/` prefix — v2 can be added without breaking v1
- **Production Dockerfile**: Multi-stage build with health checks
- **Test suite**: 52 unit tests covering math, decimals, validation, and response formatting
- **CI/CD**: GitHub Actions runs typecheck, tests, and build on every push

---

## Project Structure

```
injective-market-pulse/
├── src/
│   ├── index.ts                     # Entry point + graceful shutdown
│   ├── app.ts                       # Fastify app setup (middleware, docs, error handling)
│   ├── config/
│   │   └── index.ts                 # Environment config
│   ├── clients/
│   │   ├── injective.ts             # Injective SDK client init
│   │   └── index.ts
│   ├── services/
│   │   ├── market.service.ts        # Market normalization + filtering + sorting
│   │   ├── orderbook.service.ts     # Orderbook + depth metrics
│   │   ├── trades.service.ts        # Trades + volatility
│   │   ├── health.service.ts        # Health score algorithm
│   │   ├── analytics.service.ts     # Cross-market analytics + comparison
│   │   ├── cache.service.ts         # In-memory caching + stale fallback
│   │   └── index.ts
│   ├── controllers/
│   │   ├── markets.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── status.controller.ts
│   ├── routes/
│   │   ├── schemas.ts               # Shared OpenAPI response schemas
│   │   ├── v1/
│   │   │   ├── markets.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── status.routes.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── market.types.ts
│   │   ├── api.types.ts
│   │   └── index.ts
│   └── utils/
│       ├── errors.ts                # Custom error classes
│       ├── response.ts              # Response envelope
│       ├── validation.ts            # Input validation + bounds checking
│       ├── decimals.ts              # Chain ↔ human conversions
│       ├── math.ts                  # Volatility, spread, etc.
│       └── index.ts
├── tests/
│   ├── math.test.ts                 # 18 tests for math utilities
│   ├── decimals.test.ts             # 14 tests for decimal conversions
│   ├── validation.test.ts           # 12 tests for input validation
│   └── response.test.ts             # 8 tests for response/error classes
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI
├── .env.example
├── .gitignore
├── tsconfig.json
├── package.json
├── Dockerfile
└── README.md
```

---

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Runtime | Node.js + TypeScript | Matches Injective SDK language |
| Framework | Fastify | 2x faster than Express, built-in schema validation |
| SDK | `@injectivelabs/sdk-ts` | Official Injective TypeScript SDK |
| Docs | `@fastify/swagger` + Swagger UI | Full OpenAPI 3.0 response schemas on all endpoints |
| Caching | `node-cache` | In-memory TTL cache with stale-data fallback |
| Rate Limiting | `@fastify/rate-limit` | Per-IP rate limiting |
| Security | `@fastify/helmet` | HSTS, X-Content-Type-Options, etc. |
| Compression | `@fastify/compress` | Gzip for responses > 1KB |
| Testing | Vitest | 52 unit tests, fast ESM-native runner |
| CI | GitHub Actions | Typecheck + test + build on every push |

---

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `INJECTIVE_NETWORK` | `mainnet` | `mainnet` or `testnet` |
| `CACHE_TTL_MARKETS` | `60` | Market list cache (seconds) |
| `CACHE_TTL_ORDERBOOK` | `10` | Orderbook cache (seconds) |
| `CACHE_TTL_TRADES` | `10` | Trades cache (seconds) |
| `CACHE_TTL_HEALTH` | `30` | Health score cache (seconds) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "MARKET_NOT_FOUND",
    "message": "Market with ID '0x...' not found.",
    "statusCode": 404
  },
  "meta": {
    "timestamp": "2026-02-14T00:48:48.751Z",
    "source": "injective-mainnet",
    "apiVersion": "v1"
  }
}
```

| Code | Status | Description |
|------|--------|-------------|
| `MARKET_NOT_FOUND` | 404 | Invalid market ID |
| `INVALID_PARAMETER` | 400 | Bad query parameter |
| `UPSTREAM_ERROR` | 502 | Injective indexer unavailable |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `NOT_FOUND` | 404 | Unknown endpoint |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## License

MIT
