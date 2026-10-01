# Blocker status after code pass

| Blocker | What changed | Still open |
|---|---|---|
| Hostinger compose + DB soak | `scripts/paper-soak.mjs` + existing compose | Operator must `compose up` on Hostinger; soak n<20 = INSUFFICIENT_SAMPLE |
| Jupiter / build / simulate / paper fill | lite-api quote + optional swap ix + RPC simulate + paper ledger | Needs mint + optional `PAPER_WALLET_PUBKEY`; **no chain submit** |
| Section 70 boxes | Explicitly still unchecked | Human + multi-day evidence |
| Missing packages in zip | Added config, wallet, monitoring | Full scoring/signal/risk/position services still absent |
| Public RPC 429 | `rpc-pool` + `SOLANA_RPC_BACKUP` | Paid RPC on VPS |

| CI | `.github/workflows/ci.yml` runs node gates (no broken frozen lockfile) | GitHub must execute the workflow |
| AuthEngine | `apps/api/src/auth/engine.ts` | Wire sessions to real PG on VPS |
| Discovery ALT keys | loadedAddresses appended before parse | Paid RPC still needed under 429 |
| DB password | production boot rejects placeholders | Operator rotates `helios_app` |
| Live path | `GatedLiveRuntime` fully wired, **gate closed** | Human Section 70 on VPS |
