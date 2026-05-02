import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "child_process";

const connectors = new ReplitConnectors();

async function getGitHubUser() {
  const resp = await connectors.proxy("github", "/user", { method: "GET" });
  return resp.json() as Promise<{ login: string; name: string }>;
}

async function repoExists(owner: string, repo: string): Promise<boolean> {
  const resp = await connectors.proxy("github", `/repos/${owner}/${repo}`, { method: "GET" });
  return resp.status === 200;
}

async function createRepo(name: string, description: string): Promise<{ clone_url: string; html_url: string }> {
  const resp = await connectors.proxy("github", "/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      private: false,
      auto_init: false,
    }),
    headers: { "Content-Type": "application/json" },
  });
  if (resp.status !== 201) {
    const body = await resp.text();
    throw new Error(`Failed to create repo: ${resp.status} ${body}`);
  }
  return resp.json() as Promise<{ clone_url: string; html_url: string }>;
}

async function getToken(): Promise<string> {
  const resp = await connectors.proxy("github", "/user", { method: "GET" });
  const authHeader = (resp as unknown as { request?: { headers?: { authorization?: string } } })
    ?.request?.headers?.authorization;
  if (authHeader?.startsWith("token ")) return authHeader.slice(6);
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return "";
}

async function main() {
  console.log("🔍 Buscando usuário do GitHub...");
  const user = await getGitHubUser();
  console.log(`✅ Conectado como: ${user.login}`);

  const repoName = "emdia-financeiro";
  const owner = user.login;

  const exists = await repoExists(owner, repoName);
  let repoUrl: string;

  if (exists) {
    console.log(`✅ Repositório ${owner}/${repoName} já existe.`);
    repoUrl = `https://github.com/${owner}/${repoName}`;
  } else {
    console.log(`📦 Criando repositório ${repoName}...`);
    const repo = await createRepo(repoName, "emdia — Controle Financeiro Pessoal");
    repoUrl = repo.html_url;
    console.log(`✅ Repositório criado: ${repoUrl}`);
  }

  console.log("\n📋 Configure o remote do git com:");
  console.log(`   git remote add origin ${repoUrl}.git`);
  console.log(`   git push -u origin main`);
  console.log(`\n🔗 Repositório: ${repoUrl}`);
}

main().catch((err) => {
  console.error("Erro:", err.message);
  process.exit(1);
});
