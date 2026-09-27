import http from "node:http";
import { preflight } from "./lib/capabilities.js";
import { evaluateEvidence } from "./lib/evidence.js";

const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_BYTES = 1024 * 1024;

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store"
  });
  res.end(payload);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return send(res, 200, {
        ok: true,
        service: "free-agent-fabric-public-fallback",
        runtime: "render-node",
        architectureVersion: "continuity-v1",
        contracts: ["capability-preflight","deterministic-evidence-gate"],
        privacy: {
          anonymousPool: "public-only",
          sensitiveEvidence: "not-supported-in-fallback-core"
        },
        timestamp: new Date().toISOString()
      });
    }

    if (req.method === "POST" && url.pathname === "/preflight") {
      return send(res, 200, preflight(await readJson(req)));
    }

    if (req.method === "POST" && url.pathname === "/evidence-check") {
      const body = await readJson(req);
      return send(res, 200, evaluateEvidence(body.sources || [], body.claims || []));
    }

    return send(res, 404, { error: "Not found" });
  } catch (error) {
    return send(res, 400, { error: error instanceof Error ? error.message : String(error) });
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`free-agent-fabric fallback listening on :${PORT}`);
});
