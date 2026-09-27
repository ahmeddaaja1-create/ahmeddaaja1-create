const severity = { PASS: 0, REVIEW: 1, BLOCK: 2 };
const maxDecision = (a,b) => severity[b] > severity[a] ? b : a;

export function evaluateEvidence(sources = [], claims = []) {
  const sourceMap = new Map(sources.map(s => [s.id, s]));
  const structuralErrors = [];

  const seenSources = new Set();
  for (const s of sources) {
    if (seenSources.has(s.id)) structuralErrors.push(`Duplicate source ID: ${s.id}`);
    seenSources.add(s.id);
  }

  const seenClaims = new Set();
  for (const c of claims) {
    if (seenClaims.has(c.id)) structuralErrors.push(`Duplicate claim ID: ${c.id}`);
    seenClaims.add(c.id);
  }

  const results = claims.map(claim => {
    let decision = "PASS";
    let acceptedStatus = claim.requestedStatus || "unknown";
    const reasons = [];
    const ids = Array.isArray(claim.sourceIds) ? claim.sourceIds : [];
    const missing = ids.filter(id => !sourceMap.has(id));

    if (missing.length) {
      decision = "BLOCK";
      acceptedStatus = "unknown";
      reasons.push(`Unknown source ID(s): ${missing.join(", ")}`);
    }

    const cited = ids.map(id => sourceMap.get(id)).filter(Boolean);
    const inspected = cited.filter(s => s.accessState === "inspected");

    if (claim.claimType === "legal_conclusion") {
      decision = maxDecision(decision, "REVIEW");
      reasons.push("Legal conclusions require human/professional review.");
      if (acceptedStatus === "verified") acceptedStatus = "supported";
    }

    if (claim.requestedStatus === "verified") {
      if (!cited.length) {
        decision = "BLOCK";
        acceptedStatus = "unknown";
        reasons.push("VERIFIED requires at least one registered source.");
      }
      if (!inspected.length) {
        decision = "BLOCK";
        acceptedStatus = "unknown";
        reasons.push("VERIFIED requires at least one inspected source.");
      }
      if (inspected.length && !inspected.some(s => typeof s.locator === "string" && s.locator.trim())) {
        decision = "BLOCK";
        acceptedStatus = "unknown";
        reasons.push("VERIFIED requires a concrete source locator.");
      }
      if (claim.claimType === "legal_rule") {
        const official = inspected.some(s => s.kind === "official_public" && s.scope === "public_rule");
        if (!official) {
          decision = "BLOCK";
          acceptedStatus = "unknown";
          reasons.push("A verified legal/public rule requires inspected official_public evidence.");
        }
      }
      if (claim.scope === "case_fact") {
        const primary = inspected.some(s => s.kind === "primary_case" && s.scope === "case_fact");
        if (!primary) {
          decision = "BLOCK";
          acceptedStatus = "unknown";
          reasons.push("A verified case fact requires inspected case-specific primary evidence.");
        }
        if (inspected.some(s => s.kind === "official_public" && s.scope === "public_rule") && !primary) {
          reasons.push("General official rules cannot verify an individual case fact.");
        }
      }
    }

    if (claim.requestedStatus === "supported" && (!cited.length || !inspected.length)) {
      decision = maxDecision(decision, "REVIEW");
      acceptedStatus = "unknown";
      reasons.push("SUPPORTED should cite at least one inspected registered source.");
    }

    if (cited.some(s => s.accessState === "uninspected") && ["verified","supported"].includes(claim.requestedStatus)) {
      decision = "BLOCK";
      acceptedStatus = "unknown";
      reasons.push("Uninspected evidence cannot support VERIFIED/SUPPORTED status.");
    }

    if (cited.some(s => s.kind === "metadata_only") && claim.requestedStatus === "verified") {
      decision = "BLOCK";
      acceptedStatus = "unknown";
      reasons.push("Metadata-only evidence cannot establish a verified substantive claim.");
    }

    if (!reasons.length) reasons.push("Claim satisfies the configured evidence contract.");
    return { claimId: claim.id, decision, acceptedStatus, reasons };
  });

  const overallDecision = results.reduce(
    (d,r) => maxDecision(d,r.decision),
    structuralErrors.length ? "BLOCK" : claims.length === 0 ? "REVIEW" : "PASS"
  );

  return {
    overallDecision,
    structuralErrors,
    results,
    summary: {
      pass: results.filter(r => r.decision === "PASS").length,
      review: results.filter(r => r.decision === "REVIEW").length,
      block: results.filter(r => r.decision === "BLOCK").length
    }
  };
}
