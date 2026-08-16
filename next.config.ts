import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No AGENTS.md / CLAUDE.md generation. Owner decision, 2026-08-17 (see
  // specs/mission.md, "Owner decisions"): project rules live in specs/ alone,
  // and nothing may depend on agent files. This is the opt-out documented in
  // the bundled docs, 01-app/02-guides/ai-agents.md.
  agentRules: false,
};

export default nextConfig;
