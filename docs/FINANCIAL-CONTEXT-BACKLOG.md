# Backlog de Implementação - Contexto Financeiro

## P0 — Necessário antes de qualquer escrita
- **Descrição**: Criação dos tipos TypeScript validados no projeto.
- **Dependências**: `docs/FINANCIAL-CONTEXT-DATA-MODEL.md` (concluído).
- **Arquivos Prováveis**: `artifacts/emdia/src/domain/finance/contextTypes.ts` ou `lib/api-zod`.
- **Risco**: Baixo.
- **Critério de Aceite**: Tipos `FinancialProfile`, `ExpectedIncome`, `RecurringCommitment` existindo com validação Zod.
- **Testes**: Typecheck.

## P1 — Protótipo “Prepare seu mês”
- **Descrição**: UI de formulário onde o usuário preenche o Saldo Inicial, Metas e Compromissos do Mês.
- **Dependências**: P0.
- **Arquivos Prováveis**: `artifacts/emdia/src/features/onboarding/PrepareMonth.tsx`.
- **Risco**: Médio (UX deve ser excelente).
- **Critério de Aceite**: Usuário consegue preencher todo o fluxo de onboarding financeiro e ver um JSON resultante no final (sem salvar no banco).
- **Testes**: Testes de componente e usabilidade.

## P2 — Escrita local simulada
- **Descrição**: Persistir o `FinancialProfile` apenas no `localStorage` ou estado global local, integrando com o `DecisionSimulator` atual.
- **Dependências**: P1.
- **Arquivos Prováveis**: `artifacts/emdia/src/store/` ou `hooks/useFinancialContext.ts`.
- **Risco**: Baixo.
- **Critério de Aceite**: O `DecisionSimulator` roda 100% lendo do fluxo construído na etapa P1.
- **Testes**: Testes unitários do hook.

## P3 — Rules e Emulator
- **Descrição**: Traduzir o plano de segurança em `firestore.rules`.
- **Dependências**: P0.
- **Arquivos Prováveis**: `firebase/firestore.rules`, testes no Emulador.
- **Risco**: Alto (Risco de quebrar a segurança atual).
- **Critério de Aceite**: Conjunto de testes de segurança passando no Firebase Emulator para leitura/escrita no Contexto.
- **Testes**: Suíte do emulador.

## P4 — Escrita controlada no Firestore
- **Descrição**: Conectar o frontend "Prepare seu Mês" (P2) à gravação no Firestore, usando repositório autenticado.
- **Dependências**: P2, P3.
- **Arquivos Prováveis**: `artifacts/emdia/src/lib/firebase.ts`, repositório financeiro.
- **Risco**: Alto.
- **Critério de Aceite**: `FinancialProfile` sendo salvo no Firebase em `users/{uid}/financialContext/current`.
- **Testes**: Teste de integração Firebase.

## P5 — Beta Restrito
- **Descrição**: Liberar a funcionalidade por Feature Flag.
- **Dependências**: P4.
- **Arquivos Prováveis**: Componentes de layout (botão para iniciar a tela).
- **Risco**: Médio (impacto em usuários beta).
- **Critério de Aceite**: Flag Vercel ativada, feedback de usuário beta.
- **Testes**: Teste manual prod.
