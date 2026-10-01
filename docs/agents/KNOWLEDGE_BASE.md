# Wave 9 — Knowledge base

Read-only store for runbooks, invariants, glossary, incident notes.

- Bodies sanitized and wrapped in `<untrusted>…</untrusted>`
- Control characters stripped; fenced code fences neutralized
- Length cap 4000
- Protected sources (`wallet`, `.env`, Section 70 names) rejected
- No write-back to trading, risk, or signer modules
