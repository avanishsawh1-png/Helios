# Wave 14 — Risk engine wiring fix

- `ObservingRiskPort` wraps authorize(); hook throw does not change the decision
- Null size stays unknown / denied — never treated as 0
- Hard limits stay in code; agents cannot edit them
- Agent proposals are not arguments to `RiskPort.authorize`
