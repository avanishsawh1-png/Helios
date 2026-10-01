#!/usr/bin/env node
console.log(
  JSON.stringify({
    status: "PARTIAL",
    reason: "per-package copy/build only — no turbo pipeline",
    live: false,
  }),
);
