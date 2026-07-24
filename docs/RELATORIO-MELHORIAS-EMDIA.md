# Relatório de Melhorias Recomendadas — emdia

**Data:** Julho de 2026
**Status atual:** Código fonte único no GitHub. Deploy em produção no Firebase Hosting (emdiafinanceiro.com.br). Deploy na Vercel "emdia" é apenas pré-produção. Firebase Functions bloqueado aguardando número oficial do WhatsApp e credenciais.

---

## O que foi implementado

### ✅ Homepage redesign — Reposicionamento "Assessora Financeira no WhatsApp"

**Mudanças feitas:**
- Headline alterada para "Finanças sem planilha — só no WhatsApp"
- Badge do hero mudou pra "SUA ASSESSORA FINANCEIRA NO WHATSAPP"
- CTA principal ajustado para lista de espera/acesso antecipado
- Features e FAQ reescritos orientados ao WhatsApp
- Seções de copy atualizadas, depoimentos reais preservados sem promessas absolutas de segurança ou de IAs auto-aprendizes

### ✅ Dashboard 2.0

**Novos componentes:**
- `FinancialPulseWidget` — mostra saúde financeira geral do mês
- `RiskAlertsSection` — alertas de risco (despesas acima do planejado, vencimentos próximos)
- `QuickSimulatorSheet` — simulação rápida de compra
- `useFinancialPulse` — hook que deriva pulse financeiro das transações

### ✅ WhatsApp W5 — Motor de Consultas e Simulação

**Novos arquivos e atualizações:**
- Engine de consultas financeiras (saldo, gastos por categoria, simulação)
- Webhook com proteção de idempotência rigorosa (transações atômicas com estados processing, completed, failed) e TTL.
- Fuso horário fixado em America/Fortaleza para datas seguras.

### ✅ Prepare Your Month GA

- Feature flag `VITE_ENABLE_PREPARE_MONTH` removida (lançado oficialmente)
- `PrepareMonthEntryCard` reescrito com status badges inteligentes
- `PrepareMonthPage` reescrito com badges de qualidade/completude
- `MonthReviewCard` criado com comparação planejado vs. realizado

---

## Melhorias pendentes

### 🔴 BLOQUEADO — Integração WhatsApp (Aguardando Número Oficial)

A ativação do WhatsApp exige o número oficial. **Nenhum secret de produção deve ser inserido até que os pré-requisitos comerciais e jurídicos estejam prontos.**

**Secrets Necessários (apenas documentação):**
- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_APP_SECRET`
- `META_WHATSAPP_VERIFY_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_LINK_CODE_SECRET`

### 🟡 Etapa Futura — Firebase Functions: Node 20 → Node 22

**Problema:** Node.js 20 está suportado, mas será descontinuado na Google Cloud (out/2026). O Firebase Functions precisará de atualização.

**Como resolver:**
- Atualizar `firebase.json` para `"runtime": "nodejs22"`.
- Atualizar `firebase-functions` no `package.json`.

### 🟢 Etapa Futura — Recharts v2 → v3

**Problema:** Warning no build — Recharts 2.x não é mais mantido. Exige refatoração e testes de UI antes da atualização completa.

---

## Resumo de status

| Item | Status | Prioridade |
|------|--------|------------|
| Homepage redesign e adequação | ✅ Feito | — |
| Dashboard 2.0 | ✅ Feito | — |
| WhatsApp W5 e Idempotência | ✅ Feito | — |
| Firebase: token WhatsApp | ❌ Bloqueado | 🔴 Aguardando Número |
| Firebase: Node 22 | ❌ Pendente | 🟡 Futuro |
| Recharts v3 | ❌ Pendente | 🟢 Futuro |
