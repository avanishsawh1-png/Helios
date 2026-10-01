#!/usr/bin/env node
import { IsolatedSigner } from "./isolated-signer.mjs";

const signer = new IsolatedSigner();
const view = signer.publicView();
const result = await signer.sign({ description: "probe" });
process.stdout.write(
  JSON.stringify({ ...view, refused: result.refused, live: false, tradingMode: "PAPER" }) + "\n",
);
process.exit(result.refused ? 0 : 1);
