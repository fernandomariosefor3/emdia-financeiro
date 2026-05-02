import { ReplitConnectors } from "@replit/connectors-sdk";

const c = new ReplitConnectors();
const r = await c.proxy("github", "/repos/fernandomariosefor3/emdia-financeiro/git/refs/heads/main", { method: "GET" });
console.log("status:", r.status);
const d = await r.json();
console.log(JSON.stringify(d, null, 2));
