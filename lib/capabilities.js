export const agentPassports = [
  { id: "A1", role: "Analyst", unit: "solo", privacy: ["public"], capabilities: ["llm_text","structured_evidence"] },
  { id: "A2", role: "Builder", unit: "solo", privacy: ["public"], capabilities: ["llm_text","structured_evidence"] },
  { id: "A3", role: "Critic", unit: "solo", privacy: ["public"], capabilities: ["llm_text","structured_evidence"] },
  { id: "A4", role: "Researcher", unit: "solo", privacy: ["public"], capabilities: ["llm_text","structured_evidence","official_web_fetch"] },
  { id: "A5", role: "Verifier", unit: "solo", privacy: ["public"], capabilities: ["llm_text","structured_evidence","pdf_read","approved_derived_read"] },
  { id: "A6", role: "Synthesizer", unit: "solo", privacy: ["public"], capabilities: ["llm_text","structured_evidence"] },
  { id: "A7", role: "Explorer", unit: "P1-DISCOVERY", privacy: ["public"], capabilities: ["llm_text","structured_evidence","peer_review","official_web_fetch"] },
  { id: "A8", role: "Counter-Explorer", unit: "P1-DISCOVERY", privacy: ["public"], capabilities: ["llm_text","structured_evidence","peer_review","official_web_fetch"] },
  { id: "A9", role: "Solution Architect", unit: "P2-SOLUTION", privacy: ["public"], capabilities: ["llm_text","structured_evidence","peer_review"] },
  { id: "A10", role: "Alternative Architect", unit: "P2-SOLUTION", privacy: ["public"], capabilities: ["llm_text","structured_evidence","peer_review"] },
  { id: "A11", role: "Evidence Controller", unit: "P3-ASSURANCE", privacy: ["public"], capabilities: ["llm_text","structured_evidence","peer_review","evidence_control","pdf_read","approved_derived_read"] },
  { id: "A12", role: "Adversarial Evidence Controller", unit: "P3-ASSURANCE", privacy: ["public"], capabilities: ["llm_text","structured_evidence","peer_review","evidence_control"] }
];

export function preflight({ privacyClass = "public", requirements = [], bundles = [], candidateAgentIds = [] } = {}) {
  const candidates = candidateAgentIds.length
    ? agentPassports.filter(a => candidateAgentIds.includes(a.id))
    : agentPassports;
  const eligible = candidates.filter(a => a.privacy.includes(privacyClass));
  const blocked = candidates.filter(a => !a.privacy.includes(privacyClass));

  const coverage = requirements.map(r => {
    const matchingAgents = eligible.filter(a => a.capabilities.includes(r.capability)).map(a => a.id);
    const minAgents = Math.max(1, Number(r.minAgents || 1));
    return { ...r, minAgents, matchingAgents, covered: matchingAgents.length >= minAgents, deficit: Math.max(0, minAgents - matchingAgents.length) };
  });

  const bundleCoverage = bundles.map(b => {
    const matchingAgents = eligible.filter(a => (b.capabilities || []).every(c => a.capabilities.includes(c))).map(a => a.id);
    const minAgents = Math.max(1, Number(b.minAgents || 1));
    return { ...b, minAgents, matchingAgents, covered: matchingAgents.length >= minAgents, deficit: Math.max(0, minAgents - matchingAgents.length) };
  });

  const missingCapabilities = coverage.filter(x => !x.covered).map(x => x.capability);
  const missingBundles = bundleCoverage.filter(x => !x.covered).map(x => x.id);

  return {
    pass: eligible.length > 0 && blocked.length === 0 && missingCapabilities.length === 0 && missingBundles.length === 0,
    privacyClass,
    candidateAgents: candidates.map(a => a.id),
    privacyEligibleAgents: eligible.map(a => a.id),
    privacyBlockedAgents: blocked.map(a => a.id),
    coverage,
    bundles: bundleCoverage,
    missingCapabilities,
    missingBundles,
    assignments: [
      ...coverage.map(x => ({ requirement: x.capability, assignedAgents: x.matchingAgents.slice(0, x.minAgents) })),
      ...bundleCoverage.map(x => ({ requirement: `bundle:${x.id}`, assignedAgents: x.matchingAgents.slice(0, x.minAgents) }))
    ]
  };
}
