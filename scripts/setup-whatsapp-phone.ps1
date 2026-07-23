#Requires -Version 5.1
<#
.SYNOPSIS
    Configura interativamente os segredos do "Emdia no Zap" (WhatsApp) e,
    apenas mediante confirmação explícita, implanta somente as 4 Cloud
    Functions do WhatsApp.

.DESCRIPTION
    Este script NÃO deve ser executado até que o número de WhatsApp
    Business tenha sido comprado, ativado e cadastrado na Meta. Ele não
    recebe nenhum segredo por parâmetro, não salva nenhum valor em disco e
    nunca imprime o conteúdo de um segredo na tela.

    Cada segredo é configurado através de `firebase functions:secrets:set`,
    que abre um prompt seguro (mascarado) do próprio Firebase CLI e grava o
    valor diretamente no Google Secret Manager — o valor nunca passa por
    este script, por uma variável de shell persistida, ou por um arquivo.

    Consulte docs/WHATSAPP-PHONE-REGISTRATION.md para o checklist completo
    (compra do chip, cadastro na Meta, obtenção do Phone Number ID,
    cadastro da URL do webhook, assinatura do evento "messages" e testes).

.NOTES
    - Não aceita nenhum segredo, token ou telefone como argumento.
    - Não grava nenhum valor em arquivo.
    - Não executa deploy geral do projeto.
    - Só implanta as 4 Functions do WhatsApp, e só após confirmação "SIM"
      digitada durante a execução.
#>

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$ProjectId = "emdiafinanceiro-13483"

$RequiredSecrets = @(
    @{ Name = "META_WHATSAPP_ACCESS_TOKEN";     Description = "Token de acesso permanente do WhatsApp Cloud API (Meta)" },
    @{ Name = "META_WHATSAPP_APP_SECRET";       Description = "App Secret do app da Meta usado para validar a assinatura HMAC do webhook" },
    @{ Name = "META_WHATSAPP_VERIFY_TOKEN";     Description = "Token de verificação usado no handshake GET do webhook" },
    @{ Name = "META_WHATSAPP_PHONE_NUMBER_ID";  Description = "Phone Number ID do número WhatsApp Business cadastrado na Meta" },
    @{ Name = "WHATSAPP_LINK_CODE_SECRET";      Description = "Segredo interno usado para gerar o hash HMAC dos códigos de vinculação (não é um segredo da Meta — gere um valor aleatório forte)" }
)

$WhatsAppFunctions = @(
    "whatsappWebhook",
    "createWhatsAppLinkCode",
    "getWhatsAppConnectionStatus",
    "disconnectWhatsApp"
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

Write-Section "Emdia no Zap — configuração do telefone WhatsApp"
Write-Host "Este script só deve ser executado depois que o chip do WhatsApp Business" -ForegroundColor Yellow
Write-Host "já tiver sido comprado, ativado e cadastrado na Meta." -ForegroundColor Yellow
Write-Host ""
Write-Host "Consulte docs/WHATSAPP-PHONE-REGISTRATION.md antes de continuar." -ForegroundColor Yellow

if (-not (Confirm-Step "O número já foi comprado, ativado e cadastrado na Meta, e você tem os 5 valores em mãos?")) {
    Write-Host "Cancelado. Nenhum segredo foi alterado." -ForegroundColor Red
    exit 0
}

$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
    Write-Host "Firebase CLI não encontrado no PATH. Instale com 'npm install -g firebase-tools' e tente novamente." -ForegroundColor Red
    exit 1
}

Write-Section "Passo 1 — Configurar segredos"
Write-Host "Cada valor será solicitado pelo próprio Firebase CLI, em um prompt mascarado."
Write-Host "Nenhum valor é digitado neste script, salvo em arquivo ou exibido no terminal."

foreach ($secret in $RequiredSecrets) {
    Write-Host ""
    Write-Host "-> $($secret.Name)" -ForegroundColor Green
    Write-Host "   $($secret.Description)"

    if (-not (Confirm-Step "Configurar $($secret.Name) agora?")) {
        Write-Host "   Pulado. Você pode rodar este script novamente mais tarde para configurar o restante." -ForegroundColor Yellow
        continue
    }

    & firebase functions:secrets:set $secret.Name --project $ProjectId
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falha ao configurar $($secret.Name). Corrija o problema e rode o script novamente." -ForegroundColor Red
        exit 1
    }
}

Write-Section "Passo 2 — Implantar apenas as Functions do WhatsApp"
Write-Host "As functions a seguir serão implantadas (nenhuma outra function do projeto é tocada):"
foreach ($fn in $WhatsAppFunctions) {
    Write-Host "  - $fn"
}
Write-Host ""
Write-Host "Este passo NÃO ativa a interface no app. A ativação da interface é feita" -ForegroundColor Yellow
Write-Host "separadamente, definindo VITE_ENABLE_WHATSAPP_LINK=true no pipeline de build," -ForegroundColor Yellow
Write-Host "e só deve ocorrer depois dos testes manuais (veja o checklist da documentação)." -ForegroundColor Yellow

if (-not (Confirm-Step "Implantar as 4 Functions do WhatsApp agora?")) {
    Write-Host "Deploy cancelado. Os segredos configurados permanecem salvos no Secret Manager." -ForegroundColor Yellow
    Write-Host "Rode este script novamente quando quiser prosseguir com o deploy." -ForegroundColor Yellow
    exit 0
}

$targets = ($WhatsAppFunctions | ForEach-Object { "functions:$_" }) -join ","
& firebase deploy --only $targets --project $ProjectId
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha no deploy das Functions do WhatsApp." -ForegroundColor Red
    exit 1
}

Write-Section "Concluído"
Write-Host "Segredos configurados e Functions do WhatsApp implantadas." -ForegroundColor Green
Write-Host "Próximos passos manuais (fora deste script):"
Write-Host "  1. Cadastrar a URL do webhook (whatsappWebhook) no painel da Meta."
Write-Host "  2. Assinar o evento 'messages' no webhook."
Write-Host "  3. Testar VINCULAR, registro de despesa e confirmação SIM pelo WhatsApp real."
Write-Host "  4. Somente depois dos testes, ativar VITE_ENABLE_WHATSAPP_LINK=true no pipeline de build."
Write-Host ""
Write-Host "Checklist completo em docs/WHATSAPP-PHONE-REGISTRATION.md"
