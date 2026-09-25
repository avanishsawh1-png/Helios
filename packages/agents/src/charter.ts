/**
 * Wave 8 — Agent OS foundation.
 * Advisory only. No second trading path. No LIVE. No wallet/signer/RPC secrets.
 */

export const PROTECTED_TARGETS = [
  "manualAdminApproval",
  "section70",
  "killSwitch",
  "risk_limits",
  "HardRiskLimits",
  "TRADING_MODE",
  "wallet",
  "signer",
  "secrets",
  "auth",
  "rbac",
  "GATEWAY_CONFIG_WHITELIST",
  "db_roles",
  "ProductionGate.verified",
  ".env",
  "agent_config",
  "promotion_approval",
  "shadow_mode_toggle",
] as const;

export type ProtectedTarget = (typeof PROTECTED_TARGETS)[number];

export const AGENT_OS_CHARTER = {
  version: "wave-8",
  readOnlyByConstruction: true,
  failOpenHooks: true,
  failClosedTrading: true,
  secondTradingPath: false,
  advisoryOnly: true,
  agentsEnabledDefault: false,
  llmInExitEngine: false,
} as const;

export function isProtectedTarget(name: string): boolean {
  const n = name.trim();
  return (PROTECTED_TARGETS as readonly string[]).some(
    (t) => n === t || n.startsWith(`${t}.`) || n.startsWith(`${t}/`),
  );
}

export type AgentTier = 1 | 2 | 3;

export interface AgentProposal {
  tier: AgentTier;
  title: string;
  body: string;
  target: string;
  evidenceRefs: string[];
}

export class AgentOsBoundaryError extends Error {
  readonly code = "AGENT_OS_BOUNDARY" as const;
  constructor(message: string) {
    super(message);
    this.name = "AgentOsBoundaryError";
  }
}

const FORBIDDEN_WIRING = [
  "RiskPort",
  "ExecutionAuthorization",
  "recordExit",
  "TransactionSigner",
  "order_write",
  "position_write",
];

export function assertAdvisoryOnly(proposal: AgentProposal): void {
  if (isProtectedTarget(proposal.target)) {
    throw new AgentOsBoundaryError(`protected target: ${proposal.target}`);
  }
  for (const needle of FORBIDDEN_WIRING) {
    if (proposal.target.includes(needle) || proposal.body.includes(needle)) {
      throw new AgentOsBoundaryError(`forbidden wiring: ${needle}`);
    }
  }
  if (proposal.evidenceRefs.length === 0) {
    throw new AgentOsBoundaryError("unverified: empty EvidenceRef[]");
  }
}

export function applyProposal(_proposal: AgentProposal): never {
  throw new AgentOsBoundaryError("auto-apply forbidden — human gate only");
}
