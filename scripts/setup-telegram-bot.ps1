#Requires -Version 5.1
<#
.SYNOPSIS
    Configura interativamente os segredos do "Emdia no Telegram" e,
    apenas mediante confirmacao explicita, implanta somente as 4 Cloud
    Functions do Telegram.

.DESCRIPTION
    Este script configura os segredos do Telegram via Firebase Secret
    Manager e implanta apenas as Functions relacionadas.

    Nenhum segredo eh salvo em disco ou exibido no terminal.

    Para obter o TELEGRAM_BOT_TOKEN:
    1. Abra o Telegram e procure por @BotFather
    2. Envie /newbot e siga as instrucoes
    3. Copie o token HTTP API gerado

    Para configurar o webhook apos o deploy:
    curl https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL_DA_FUNCTION>&secret_token=<WEBHOOK_SECRET>
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$ProjectId = "emdiafinanceiro-13483"

$RequiredSecrets = @(
    @{ Name = "TELEGRAM_BOT_TOKEN";           Description = "Token do bot obtido via @BotFather no Telegram" },
    @{ Name = "TELEGRAM_WEBHOOK_SECRET";      Description = "Segredo que valida o header X-Telegram-Bot-Api-Secret-Token (gere um valor aleatorio forte, ex: openssl rand -hex 32)" },
    @{ Name = "TELEGRAM_LINK_CODE_SECRET";    Description = "Segredo interno para gerar hash HMAC dos codigos de vinculacao Telegram (gere um valor aleatorio forte)" }
)

$TelegramFunctions = @(
    "telegramWebhook",
    "createTelegramLinkCode",
    "getTelegramConnectionStatus",
    "disconnectTelegram"
)

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "=== $Title ===" -ForegroundColor Cyan
}

function Confirm-Step {
    param([string]$Prompt)
    $response = Read-Host "$Prompt (digite SIM para continuar, qualquer outra coisa para cancelar)"
    return $response -ceq "SIM"
}

Write-Section "Emdia no Telegram — configuracao do bot"
Write-Host "Antes de continuar, voce precisa:" -ForegroundColor Yellow
Write-Host "1. Criar um bot no Telegram com @BotFather (/newbot)" -ForegroundColor Yellow
Write-Host "2. Ter o token HTTP API do bot em maos" -ForegroundColor Yellow
Write-Host "3. Gerar um webhook secret forte (ex: openssl rand -hex 32)" -ForegroundColor Yellow
Write-Host ""

if (-not (Confirm-Step "Voce ja criou o bot no @BotFather e tem o token?")) {
    Write-Host "Cancelado. Nenhum segredo foi alterado." -ForegroundColor Red
    exit 0
}

$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
    Write-Host "Firebase CLI nao encontrado no PATH. Instale com 'npm install -g firebase-tools' e tente novamente." -ForegroundColor Red
    exit 1
}

Write-Section "Passo 1 — Configurar segredos"
Write-Host "Cada valor sera solicitado pelo proprio Firebase CLI, em um prompt mascarado."
Write-Host "Nenhum valor e digitado neste script, salvo em arquivo ou exibido no terminal."

foreach ($secret in $RequiredSecrets) {
    Write-Host ""
    Write-Host "-> $($secret.Name)" -ForegroundColor Green
    Write-Host "   $($secret.Description)"

    if (-not (Confirm-Step "Configurar $($secret.Name) agora?")) {
        Write-Host "   Pulado. Voce pode rodar este script novamente mais tarde para configurar o restante." -ForegroundColor Yellow
        continue
    }

    & firebase functions:secrets:set $secret.Name --project $ProjectId
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falha ao configurar $($secret.Name). Corrija o problema e rode o script novamente." -ForegroundColor Red
        exit 1
    }
}

Write-Section "Passo 2 — Implantar apenas as Functions do Telegram"
Write-Host "As functions a seguir serao implantadas (nenhuma outra function do projeto e tocada):"
foreach ($fn in $TelegramFunctions) {
    Write-Host "  - $fn"
}
Write-Host ""

if (-not (Confirm-Step "Implantar as 4 Functions do Telegram agora?")) {
    Write-Host "Deploy cancelado. Os segredos configurados permanecem salvos no Secret Manager." -ForegroundColor Yellow
    exit 0
}

$targets = ($TelegramFunctions | ForEach-Object { "functions:$_" }) -join ","
& firebase deploy --only $targets --project $ProjectId
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha no deploy das Functions do Telegram." -ForegroundColor Red
    exit 1
}

Write-Section "Passo 3 — Registrar o webhook no Telegram"
Write-Host "IMPORTANTE: Apos o deploy, voce precisa registrar a URL do webhook no Telegram." -ForegroundColor Yellow
Write-Host ""
Write-Host "Execute o comando abaixo (substitua pelos valores reais):" -ForegroundColor Cyan
Write-Host ""
Write-Host 'curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<FUNCTION_URL>&secret_token=<WEBHOOK_SECRET>"'
Write-Host ""
Write-Host "Onde:"
Write-Host "  <BOT_TOKEN>        = seu TELEGRAM_BOT_TOKEN"
Write-Host "  <FUNCTION_URL>     = URL da function telegramWebhook (ex: https://us-central1-emdiafinanceiro-13483.cloudfunctions.net/telegramWebhook)"
Write-Host "  <WEBHOOK_SECRET>   = mesmo valor de TELEGRAM_WEBHOOK_SECRET"
Write-Host ""
Write-Host "Exemplo (substitua os valores!):"
Write-Host 'curl -X POST "https://api.telegram.org/bot123456:ABC-DEF1234gh/setWebhook?url=https://us-central1-emdiafinanceiro-13483.cloudfunctions.net/telegramWebhook&secret_token=meu-segredo-aqui"'

Write-Section "Concluido"
Write-Host "Segredos configurados e Functions do Telegram implantadas." -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:"
Write-Host "  1. Registrar o webhook no Telegram (veja Passo 3 acima)"
Write-Host "  2. Testar enviando /start para o bot"
Write-Host "  3. Testar vinculacao e registro de despesa"
Write-Host "  4. Ativar VITE_ENABLE_TELEGRAM_LINK=true no pipeline de build"
