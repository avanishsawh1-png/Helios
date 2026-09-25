/**
 * Decode PumpSwap Pool account. Fail closed:
 * - wrong owner → null
 * - wrong discriminator → null
 * - truncated → null
 * Never a partial pool.
 */

import {
  POOL_ACCOUNT_DISCRIMINATOR,
  PUMPSWAP_PROGRAM_ID,
} from "./constants.js";

export interface DecodedPool {
  poolBump: number;
  index: number;
  creator: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  poolBaseTokenAccount: string;
  poolQuoteTokenAccount: string;
  lpSupply: bigint;
  coinCreator: string;
  isMayhemMode: boolean;
}

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(bytes: Buffer): string {
  if (bytes.length === 0) return "";
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i]!;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j]! << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let str = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) str += "1";
  for (let i = digits.length - 1; i >= 0; i--) str += BASE58_ALPHABET[digits[i]!]!;
  return str;
}

function readPubkey(buf: Buffer, offset: number): string {
  return base58Encode(buf.subarray(offset, offset + 32));
}

/**
 * Decode pool account data bytes. Does not check owner — caller must.
 */
export function decodePoolAccountData(data: Buffer | Uint8Array): DecodedPool | null {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  // disc(8) + u8 + u16 + 7*pubkey(224) + u64 + pubkey + 2*bool + ... minimal ~8+1+2+224+8+32+2 = 277
  if (buf.length < 277) return null;
  if (!buf.subarray(0, 8).equals(POOL_ACCOUNT_DISCRIMINATOR)) return null;

  let o = 8;
  const poolBump = buf[o]!;
  o += 1;
  const index = buf.readUInt16LE(o);
  o += 2;
  const creator = readPubkey(buf, o); o += 32;
  const baseMint = readPubkey(buf, o); o += 32;
  const quoteMint = readPubkey(buf, o); o += 32;
  const lpMint = readPubkey(buf, o); o += 32;
  const poolBaseTokenAccount = readPubkey(buf, o); o += 32;
  const poolQuoteTokenAccount = readPubkey(buf, o); o += 32;
  if (o + 8 + 32 + 2 > buf.length) return null;
  const lpSupply = buf.readBigUInt64LE(o); o += 8;
  const coinCreator = readPubkey(buf, o); o += 32;
  const isMayhemMode = buf[o]! !== 0;

  return {
    poolBump,
    index,
    creator,
    baseMint,
    quoteMint,
    lpMint,
    poolBaseTokenAccount,
    poolQuoteTokenAccount,
    lpSupply,
    coinCreator,
    isMayhemMode,
  };
}

export function extractAccountDataAndOwner(accountInfo: unknown): {
  data: Buffer | null;
  owner: string | null;
} {
  if (accountInfo === null || accountInfo === undefined) {
    return { data: null, owner: null };
  }
  let raw: unknown = accountInfo;
  if (typeof accountInfo === "object" && accountInfo !== null && "value" in accountInfo) {
    raw = (accountInfo as { value: unknown }).value;
  }
  if (raw === null) return { data: null, owner: null };

  let owner: string | null = null;
  let data: Buffer | null = null;

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.owner === "string") owner = obj.owner;
    const d = obj.data;
    if (Array.isArray(d) && typeof d[0] === "string") {
      data = Buffer.from(d[0], "base64");
    } else if (typeof d === "string") {
      data = Buffer.from(d, "base64");
    } else if (Buffer.isBuffer(d)) {
      data = d;
    } else if (d instanceof Uint8Array) {
      data = Buffer.from(d);
    }
  }
  return { data, owner };
}

/**
 * Full verify: owner must be PumpSwap program, then decode.
 */
export function decodePumpSwapPoolAccount(accountInfo: unknown): DecodedPool | null {
  const { data, owner } = extractAccountDataAndOwner(accountInfo);
  if (!data) return null;
  if (owner !== PUMPSWAP_PROGRAM_ID) return null;
  return decodePoolAccountData(data);
}
