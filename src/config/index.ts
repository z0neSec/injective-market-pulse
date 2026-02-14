import dotenv from 'dotenv';
dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
  injective: {
    network: (process.env.INJECTIVE_NETWORK || 'mainnet') as 'mainnet' | 'testnet',
  },
  cache: {
    markets: parseInt(process.env.CACHE_TTL_MARKETS || '60', 10),
    orderbook: parseInt(process.env.CACHE_TTL_ORDERBOOK || '10', 10),
    trades: parseInt(process.env.CACHE_TTL_TRADES || '10', 10),
    health: parseInt(process.env.CACHE_TTL_HEALTH || '30', 10),
    analytics: parseInt(process.env.CACHE_TTL_ANALYTICS || '60', 10),
  },
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },
} as const;
