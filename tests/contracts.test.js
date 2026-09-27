import test from "node:test";
import assert from "node:assert/strict";
import { preflight } from "../lib/capabilities.js";
import { evaluateEvidence } from "../lib/evidence.js";

test("evidence-control redundancy", () => {
  const r = preflight({ requirements:[{ capability:"evidence_control", minAgents:2 }] });
  assert.equal(r.pass, true);
  assert.deepEqual(r.coverage[0].matchingAgents, ["A11","A12"]);
});

test("missing browser blocks preflight", () => {
  const r = preflight({ requirements:[{ capability:"browser", minAgents:1 }] });
  assert.equal(r.pass, false);
});

test("official rule cannot verify personal fact", () => {
  const r = evaluateEvidence(
    [{ id:"O1", kind:"official_public", accessState:"inspected", scope:"public_rule", locator:"https://example.gov/rule" }],
    [{ id:"C1", claimType:"factual", scope:"case_fact", requestedStatus:"verified", sourceIds:["O1"] }]
  );
  assert.equal(r.overallDecision, "BLOCK");
});

test("derived case supports but does not verify", () => {
  const sources = [{ id:"D1", kind:"derived_case", accessState:"inspected", scope:"case_fact", locator:"vault:sha256:test" }];
  assert.equal(evaluateEvidence(sources,[{ id:"C1", claimType:"factual", scope:"case_fact", requestedStatus:"supported", sourceIds:["D1"] }]).overallDecision, "PASS");
  assert.equal(evaluateEvidence(sources,[{ id:"C2", claimType:"factual", scope:"case_fact", requestedStatus:"verified", sourceIds:["D1"] }]).overallDecision, "BLOCK");
});
