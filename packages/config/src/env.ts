/**
 * Control-plane vs trading-runtime env. Fail closed. No LIVE from env.
 */

export function forbidLiveSecrets(env = process.env) {
  const banned = ["WALLET_PRIVATE_KEY", "SECRET_KEY", "PRIVATE_KEY", "SOLANA_PRIVATE_KEY"];
  const hits = banned.filter((k) => env[k] && String(env[k]).trim());
  if (hits.length) throw new Error(`forbidLiveSecrets: ${hits.join(",")}`);
}

export function controlPlaneEnv(env = process.env) {
  forbidLiveSecrets(env);
  return {
    NODE_ENV: env.NODE_ENV ?? "production",
    DATABASE_URL: env.DATABASE_URL ?? null,
    CONTROL_GATEWAY_URL: env.CONTROL_GATEWAY_URL ?? "http://control-gateway:3100",
    TRADING_MODE: "PAPER",
  };
}

export function tradingRuntimeEnv(env = process.env) {
  forbidLiveSecrets(env);
  const primary = env.SOLANA_RPC_PRIMARY ?? "https://api.mainnet-beta.solana.com";
  const backups = String(env.SOLANA_RPC_BACKUP ?? "https://solana-rpc.publicnode.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    DATABASE_URL: env.DATABASE_URL ?? null,
    REDIS_URL: env.REDIS_URL ?? null,
    rpcEndpoints: [primary, ...backups],
    PAPER_WALLET_PUBKEY: env.PAPER_WALLET_PUBKEY ?? null,
    JUPITER_API_KEY: env.JUPITER_API_KEY ?? null,
    JUPITER_QUOTE_URL: env.JUPITER_QUOTE_URL ?? "https://lite-api.jup.ag/swap/v1/quote",
    TRADING_MODE: "PAPER",
  };
}
