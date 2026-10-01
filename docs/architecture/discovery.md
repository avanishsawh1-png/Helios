# Discovery (pump.fun → mint universe)

Missing files that references expected:

- `services/discovery/src/sources/pumpfun-parse.ts`
- `packages/solana/src/metadata/find-metadata-pda.ts`

`discover` now:

1. Operator `PAPER_MINTS` override if present
2. Else `getSignaturesForAddress` on pump.fun program + parse create account[0] as mint
3. Else EMPTY / UNAVAILABLE — no invented mints

Analyze consumes that universe. Token stats are still not fabricated.
