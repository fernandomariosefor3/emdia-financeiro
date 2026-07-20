# Relatório de Reaproveitamento Seletivo

Este documento analisa os componentes e arquivos identificados na branch de backup (`backup/local-work-2026-07-19`) e define o que deve ser transportado para a nova branch `antigravity/decision-engine-foundation` (V3), respeitando a nova arquitetura e o Motor Financeiro.

## 1. `AIChatInput.tsx`
- **Finalidade:** Componente de entrada para interação com a IA via texto (e futuramente áudio).
- **Compatibilidade:** Alta. O componente é visualmente rico e usa Lucide e Tailwind, que já estão na `origin/main`.
- **Conflito:** Não existe na `origin/main`.
- **Partes Reutilizáveis:** Toda a estrutura de UI e animações.
- **Partes Descartadas:** Não integrá-lo ainda ao dashboard ou à function sem passar pelo Motor Financeiro.
- **Decisão:** Reutilizar (apenas como componente UI).
- **Justificativa:** É a base para a futura interação com a assistente Lia. Será incluído apenas quando a UI "Hoje" for montada.

## 2. `ErrorBoundary.tsx` e `LoadingSpinner.tsx`
- **Finalidade:** Tratamento de erros no React e feedback visual de carregamento.
- **Compatibilidade:** Total.
- **Conflito:** Nenhum conflito direto, se não existirem na branch atual.
- **Partes Reutilizáveis:** Código inteiro.
- **Decisão:** Reutilizar.
- **Justificativa:** São utilitários genéricos de boas práticas e facilmente portáveis.

## 3. `InsightsCard.tsx`
- **Finalidade:** Exibir estatísticas de gastos e alertas visuais no dashboard antigo.
- **Compatibilidade:** Média. O design é útil, mas o conceito de "Insight" genérico será substituído por "Ação" e "Risco".
- **Conflito:** O dashboard atual na `origin/main` tem um escopo de UI diferente.
- **Partes Reutilizáveis:** Estilos Tailwind e estrutura do cartão.
- **Partes Descartadas:** A lógica acoplada de cálculos de categorias.
- **Decisão:** Não utilizar (usar apenas como referência visual).
- **Justificativa:** O Motor Financeiro produzirá a "Ação Prioritária", que precisará de um card com uma semântica muito mais específica que a do `InsightsCard`.

## 4. `PremiumReports.tsx` e `ProBadge.tsx`
- **Finalidade:** Funcionalidades do plano Pro e selos visuais.
- **Compatibilidade:** Incompatível com o estado atual.
- **Conflito:** A branch `origin/main` já integrou um sistema de planos Pro atualizado. Injetar esses componentes causaria código duplicado e regressão de arquitetura.
- **Partes Reutilizáveis:** Nenhuma.
- **Decisão:** Não utilizar.
- **Justificativa:** O repositório já possui uma evolução mais estável do ecossistema de monetização na branch `main`.

## 5. `functions/index.ts`, `functions/package.json` e `functions/tsconfig.json`
- **Finalidade:** Função Firebase conectada à OpenAI para processar textos financeiros.
- **Compatibilidade:** Baixa (na lógica). O novo produto define que a IA apenas interpreta e explica, enquanto o motor determinístico valida. A function antiga provavelmente executava inserções diretas no Firestore ou cálculos arriscados.
- **Conflito:** Não existe na `origin/main`.
- **Partes Reutilizáveis:** Apenas as configurações do Node.js (`package.json`, `tsconfig.json`) e a base do Express/Firebase Functions.
- **Partes Descartadas:** O prompt antigo que gerava transações diretas e a integração impura com banco de dados.
- **Decisão:** Reescrever.
- **Justificativa:** A Cloud Function precisará ser redesenhada para agir apenas como um conversor de Linguagem Natural -> JSON, sendo o Motor Financeiro (que estamos construindo) a única fonte da verdade dos cálculos.
