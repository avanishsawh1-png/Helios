/** Rank only mints that have a complete feature snapshot. Never invent features. */

export function analyzeFeatures(mints, featuresByMint = {}) {
  return mints.map((mint) => {
    const f = featuresByMint[mint];
    const complete =
      f &&
      f.security != null &&
      f.smartMoney != null &&
      f.momentum != null &&
      f.holder != null;
    return {
      mint,
      features: complete ? f : null,
      availability: complete ? "OK" : "UNAVAILABLE",
    };
  });
}

export function rankCandidates(analyzed, weights, floor = 0.2) {
  const scored = [];
  for (const row of analyzed) {
    if (row.availability !== "OK" || !row.features) continue;
    const score =
      row.features.security * weights.security +
      row.features.smartMoney * weights.smartMoney +
      row.features.momentum * weights.momentum +
      row.features.holder * weights.holder;
    scored.push({ mint: row.mint, score, availability: "OK" });
  }
  scored.sort((a, b) => b.score - a.score);
  const eligible = scored.filter((s) => s.score >= floor);
  return {
    ranked: scored,
    top: eligible[0] ?? null,
    availability: analyzed.length === 0 ? "EMPTY" : scored.length ? "OK" : "UNAVAILABLE",
  };
}
