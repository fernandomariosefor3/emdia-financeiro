# Relatório de Melhorias Recomendadas — emdia

**Data:** 23 de Julho de 2025
**Status atual:** Deploy em produção na Vercel. Firebase Functions pendente do token WhatsApp.

---

## O que foi implementado

### ✅ Homepage redesign — Reposicionamento "Assessora Financeira no WhatsApp"

**Mudanças feitas:**
- Headline alterada para "Finanças sem planilha — só no WhatsApp"
- Badge do hero mudou pra "SUA ASSESSORA FINANCEIRA NO WHATSAPP"
- Mockup do dashboard substituído por conversa real do WhatsApp (Lia respondendo "Posso comprar um tênis de R$ 450?")
- CTA principal: "Começar no WhatsApp"
- 3 passos do "Como funciona" reescritos com fluxo WhatsApp-first
- Features substituídas por 6 funcionalidades orientadas ao WhatsApp
- FAQ totalmente novo com perguntas sobre WhatsApp
- Seções de copy atualizadas (hero, demo chart, CTA)

### ✅ Dashboard 2.0

**Novos componentes:**
- `FinancialPulseWidget` — mostra saúde financeira geral do mês
- `RiskAlertsSection` — alertas de risco (despesas acima do planejado, vencimentos próximos)
- `QuickSimulatorSheet` — simulação rápida de compra
- `useFinancialPulse` — hook que deriva pulse financeiro das transações

### ✅ WhatsApp W5 — Motor de Consultas e Simulação

**Novos arquivos:**
- `functions/src/whatsapp/queries.ts` — engine de consultas financeiras (saldo, gastos por categoria, simulação)
- Parser atualizado com intent de consulta e simulação
- Webhook atualizado com roteamento inteligente
- Tipos atualizados com `ParsedWhatsAppIntent`, `ParsedSimulateIntent`

### ✅ Prepare Your Month GA

- Feature flag `VITE_ENABLE_PREPARE_MONTH` removida (lançado oficialmente)
- `PrepareMonthEntryCard` reescrito com status badges inteligentes
- `PrepareMonthPage` reescrito com badges de qualidade/completude
- `MonthReviewCard` criado com comparação planejado vs. realizado
- Nav do dashboard atualizado com "Planeje seu mês"

---

## Melhorias pendentes

### 🔴 Urgente — Firebase Functions: Secret do WhatsApp

**Problema:** O deploy do Firebase Functions trava porque o secret `META_WHATSAPP_ACCESS_TOKEN` não existe.

**Como resolver:**

1. Criar app na Meta for Developers (developers.facebook.com)
   - Tipo: "Business"
   - Adicionar produto "WhatsApp"
   - Gerar Token de Acesso Permanente

2. Configurar secrets:
```bash
cd "C:\Users\User\Desktop\Projetos\emdia-financeiro-v3"
firebase functions:secrets:set META_WHATSAPP_ACCESS_TOKEN
# (colar o token e Enter)

firebase deploy --only functions
```

3. Secrets adicionais necessários depois:
   - `META_WABA_ID` — ID do WhatsApp Business
   - `META_PHONE_NUMBER_ID` — ID do número de telefone

---

### 🟡 Breve — Firebase Functions: Node 20 → Node 22

**Problema:** Node.js 20 está deprecated na Google Cloud (desliga em out/2026). O Firebase Functions vai parar de funcionar se não atualizar.

**Como resolver:**

1. No arquivo `firebase.json`, alterar:
```json
"runtime": "nodejs20"
```
para:
```json
"runtime": "nodejs22"
```

2. Atualizar dependência:
```bash
cd "C:\Users\User\Desktop\Projetos\emdia-financeiro-v3\functions"
npm install --save firebase-functions@latest
```

3. Deployar:
```bash
firebase deploy --only functions
```

---

### 🟡 Breve — Firebase Functions: firebase-functions desatualizado

**Problema:** Warning "package.json indicates an outdated version of firebase-functions".

**Como resolver:**
```bash
cd "C:\Users\User\Desktop\Projetos\emdia-financeiro-v3\functions"
npm install --save firebase-functions@latest
firebase deploy --only functions
```

---

### 🟢 Depois — Recharts v2 → v3

**Problema:** Warning no build da Vercel — Recharts 2.x não é mais mantido.

**Como resolver:**
```bash
cd "C:\Users\User\Desktop\Projetos\emdia-financeiro-v3\artifacts\emdia"
npm install recharts@latest
git add .
git commit -m "chore: upgrade recharts to v3"
git push
```
A Vercel vai buildar automaticamente.

---

### 🟢 Depois — Vercel: conectar GitHub (JÁ FEITO ✅)

O projeto `emdia` na Vercel já está conectado ao repo `fernandomariosefor3/emdia-financeiro`. A cada push no GitHub, a Vercel faz o deploy automaticamente.

---

## Resumo de status

| Item | Status | Prioridade |
|------|--------|------------|
| Homepage redesign | ✅ Feito | — |
| Dashboard 2.0 | ✅ Feito | — |
| WhatsApp W5 | ✅ Feito | — |
| Prepare Your Month GA | ✅ Feito | — |
| Vercel deploy | ✅ Feito | — |
| GitHub → Vercel CI | ✅ Feito | — |
| Firebase: token WhatsApp | ❌ Pendente | 🔴 Urgente |
| Firebase: Node 22 | ❌ Pendente | 🟡 Breve |
| Firebase: firebase-functions@latest | ❌ Pendente | 🟡 Breve |
| Recharts v3 | ❌ Pendente | 🟢 Depois |

---

## Ordem recomendada de execução

1. **Criar app na Meta** e pegar token WhatsApp (desbloqueia Firebase)
2. **Configurar secret** e deployar Firebase Functions
3. **Atualizar Node 22** e firebase-functions no Firebase
4. **Upgrade Recharts v3** (quick win — só um comando)
