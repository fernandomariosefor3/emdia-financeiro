import { ReplitConnectors } from "@replit/connectors-sdk";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";

const connectors = new ReplitConnectors();
const ROOT = "/home/runner/workspace";
const OWNER = "fernandomariosefor3";
const REPO = "emdia-financeiro";

async function gh(path: string, method = "GET", body?: unknown) {
  const resp = await connectors.proxy("github", path, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}),
  } as Parameters<typeof connectors.proxy>[2]);
  const text = await resp.text();
  if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
    throw new Error(`Non-JSON (${resp.status}): ${text.slice(0, 300)}`);
  }
  const data = JSON.parse(text);
  if (resp.status >= 400) {
    throw new Error(`GitHub ${method} ${path} → ${resp.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data as Record<string, unknown>;
}

const SKIP = new Set(["node_modules", ".git", "dist", ".cache", ".local", "attached_assets"]);

function collectFiles(dir: string): Array<{ path: string; content: string }> {
  const results: Array<{ path: string; content: string }> = [];
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return results; }
  for (const entry of entries) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (stat.size < 200_000) {
      const rel = relative(ROOT, full);
      try {
        const content = readFileSync(full, "utf-8");
        if (!content.includes("\0")) results.push({ path: rel, content });
      } catch { /* skip binary */ }
    }
  }
  return results;
}

async function run() {
  const user = await gh("/user") as { login: string };
  console.log(`👤 Usuário: ${user.login}`);

  const included = [
    "artifacts/emdia",
    "artifacts/api-server/src",
    "artifacts/api-server/package.json",
    "lib",
    "scripts/src",
    "scripts/package.json",
    "firebase.json",
    ".firebaserc",
    "package.json",
    "pnpm-workspace.yaml",
    "tsconfig.base.json",
    "tsconfig.json",
    ".gitignore",
    "replit.md",
  ];

  const files: Array<{ path: string; content: string }> = [];
  for (const rel of included) {
    const full = join(ROOT, rel);
    if (!existsSync(full)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...collectFiles(full));
    else {
      try {
        const content = readFileSync(full, "utf-8");
        if (!content.includes("\0")) files.push({ path: rel, content });
      } catch { /* skip */ }
    }
  }
  console.log(`📁 ${files.length} arquivos encontrados`);

  console.log("📄 Inicializando repositório com README...");
  const readmeContent = Buffer.from(
    `# emdia — Controle Financeiro\n\nPlataforma de controle financeiro pessoal.\n\n## Firebase\n\nProjeto: \`emdiafinanceiro-13483\`\n\n## Deploy\n\n\`\`\`bash\nnpm install -g firebase-tools\nfirebase deploy\n\`\`\`\n`
  ).toString("base64");

  await gh(`/repos/${OWNER}/${REPO}/contents/README.md`, "PUT", {
    message: "chore: init repository",
    content: readmeContent,
  });
  console.log("   README criado");

  console.log("📦 Buscando SHA do commit inicial...");
  const refData = await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/main`) as { object: { sha: string } };
  const baseSha = refData.object.sha;
  console.log(`   base commit: ${baseSha}`);

  const commitData = await gh(`/repos/${OWNER}/${REPO}/git/commits/${baseSha}`) as { tree: { sha: string } };
  const baseTreeSha = commitData.tree.sha;

  console.log("🌲 Criando tree completa...");
  const treeItems = files.map(f => ({
    path: f.path,
    mode: "100644",
    type: "blob",
    content: f.content,
  }));

  const tree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, "POST", {
    base_tree: baseTreeSha,
    tree: treeItems,
  }) as { sha: string };
  console.log(`   tree: ${tree.sha}`);

  console.log("📝 Criando commit final...");
  const commit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, "POST", {
    message: "feat: emdia financeiro — setup com Firebase e GitHub",
    tree: tree.sha,
    parents: [baseSha],
  }) as { sha: string };
  console.log(`   commit: ${commit.sha}`);

  console.log("🔖 Atualizando branch main...");
  await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/main`, "PATCH", {
    sha: commit.sha,
    force: false,
  });

  console.log(`\n✅ Código enviado com sucesso!`);
  console.log(`🔗 https://github.com/${OWNER}/${REPO}`);
}

run().catch((err) => {
  console.error("❌", err.message ?? err);
  process.exit(1);
});
