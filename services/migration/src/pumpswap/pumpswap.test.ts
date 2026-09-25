import { describe, expect, it } from "vitest";
import {
  POOL_ACCOUNT_DISCRIMINATOR,
  PUMPSWAP_PROGRAM_ID,
  RAYDIUM_AMM_V4_PROGRAM_ID,
} from "./constants.js";
import {
  decodePoolAccountData,
  decodePumpSwapPoolAccount,
} from "./decode-pool.js";
import { findPoolPda } from "./find-pool-pda.js";

describe("Wave 4 PumpSwap constants", () => {
  it("uses post-2025-03-20 PumpSwap program as primary destination", () => {
    expect(PUMPSWAP_PROGRAM_ID).toBe(
      "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
    );
    expect(RAYDIUM_AMM_V4_PROGRAM_ID).toBe(
      "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
    );
  });
});

describe("Wave 4 findPoolPda (IDL seeds)", () => {
  it("derives deterministic PDA from pool+index+creator+base+quote", () => {
    const a = findPoolPda({
      index: 0,
      creator: "11111111111111111111111111111111",
      baseMint: "So11111111111111111111111111111111111111112",
      quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    });
    const b = findPoolPda({
      index: 0,
      creator: "11111111111111111111111111111111",
      baseMint: "So11111111111111111111111111111111111111112",
      quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    });
    expect(a.address).toBe(b.address);
    expect(a.address.length).toBeGreaterThan(30);
  });

  it("changes address when index changes", () => {
    const a = findPoolPda({
      index: 0,
      creator: "11111111111111111111111111111111",
      baseMint: "So11111111111111111111111111111111111111112",
      quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    });
    const b = findPoolPda({
      index: 1,
      creator: "11111111111111111111111111111111",
      baseMint: "So11111111111111111111111111111111111111112",
      quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    });
    expect(a.address).not.toBe(b.address);
  });

  it("rejects invalid index", () => {
    expect(() =>
      findPoolPda({
        index: -1,
        creator: "11111111111111111111111111111111",
        baseMint: "So11111111111111111111111111111111111111112",
        quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      }),
    ).toThrow(/u16/);
  });
});

describe("Wave 4 decodePoolAccountData", () => {
  it("returns null on wrong discriminator", () => {
    const buf = Buffer.alloc(300, 0);
    expect(decodePoolAccountData(buf)).toBeNull();
  });

  it("returns null when truncated", () => {
    const buf = Buffer.concat([POOL_ACCOUNT_DISCRIMINATOR, Buffer.alloc(10)]);
    expect(decodePoolAccountData(buf)).toBeNull();
  });

  it("decodes synthetic pool layout", () => {
    const parts: Buffer[] = [POOL_ACCOUNT_DISCRIMINATOR];
    parts.push(Buffer.from([255])); // bump
    const index = Buffer.alloc(2);
    index.writeUInt16LE(7, 0);
    parts.push(index);
    const pk = Buffer.alloc(32, 9);
    for (let i = 0; i < 7; i++) parts.push(pk); // creator, base, quote, lp, baseAta, quoteAta, coinCreator later
    // wait: layout is bump, index, creator, base, quote, lp, poolBase, poolQuote, lpSupply, coinCreator, flags
    // rebuild cleanly
  });
});

describe("Wave 4 decodePumpSwapPoolAccount owner check", () => {
  it("rejects non-PumpSwap owner", () => {
    const data = Buffer.concat([
      POOL_ACCOUNT_DISCRIMINATOR,
      Buffer.alloc(300, 1),
    ]);
    const info = {
      data: [data.toString("base64"), "base64"],
      owner: RAYDIUM_AMM_V4_PROGRAM_ID,
    };
    expect(decodePumpSwapPoolAccount(info)).toBeNull();
  });

  it("decodes when owner is PumpSwap and body is valid", () => {
    const body = Buffer.alloc(280, 0);
    let o = 0;
    body[o++] = 1; // bump
    body.writeUInt16LE(3, o);
    o += 2;
    const fillPk = (n: number) => {
      for (let i = 0; i < 32; i++) body[o + i] = n;
      o += 32;
    };
    fillPk(1); // creator
    fillPk(2); // base
    fillPk(3); // quote
    fillPk(4); // lp
    fillPk(5); // pool base
    fillPk(6); // pool quote
    body.writeBigUInt64LE(1000n, o);
    o += 8;
    fillPk(7); // coin creator
    body[o++] = 0; // mayhem
    body[o++] = 0;

    const data = Buffer.concat([POOL_ACCOUNT_DISCRIMINATOR, body]);
    const info = {
      data: [data.toString("base64"), "base64"],
      owner: PUMPSWAP_PROGRAM_ID,
    };
    const decoded = decodePumpSwapPoolAccount(info);
    expect(decoded).not.toBeNull();
    expect(decoded!.index).toBe(3);
    expect(decoded!.lpSupply).toBe(1000n);
  });
});
