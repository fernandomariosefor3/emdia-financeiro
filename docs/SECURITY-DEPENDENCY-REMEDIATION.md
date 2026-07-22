# Remediação de Dependências Vulneráveis (Issue #12)

## Linha de base

Auditoria executada em `main` (SHA `c3b6e9c5228b1dac51fb61ea38c24eacdb307aeb`), antes de
qualquer alteração:

```
15 vulnerabilidades encontradas
Severidade: 3 low | 5 moderate | 6 high | 1 critical
```

Nota: em relação à auditoria da sessão anterior, 3 novas vulnerabilidades high apareceram
(`linkify-it`, `fast-uri` ×2) — a base de advisories do npm/pnpm foi atualizada entre as
sessões; não há relação com nenhuma mudança de código deste projeto.

## Dependências atualizadas

| Pacote | Antes | Depois | Tipo de mudança |
|--------|-------|--------|------------------|
| `vite` (catálogo pnpm) | `^7.3.2` (resolvido: 7.3.3) | `^7.3.5` (resolvido: 7.3.6) | patch, mesma major |
| `orval` (devDependency direta de `@workspace/api-spec`) | `^8.5.2` (resolvido: 8.12.3) | `^8.22.0` (resolvido: 8.22.0) | minor, mesma major |
| `websocket-driver` (transitiva, via `firebase`) | 0.7.4 | 0.7.5 | refresh de resolução — nenhuma mudança em `firebase` |
| `typedoc` (transitiva, via `orval`) | 0.28.19 | 0.28.20 | patch, arrasto do bump de `orval` |
| `markdown-it` (transitiva) | 14.2.0 | 14.3.0 | minor, arrasto do bump de `orval`/`typedoc` |
| `minimatch` (transitiva) | 10.2.5 | 10.2.5 (inalterado) | — |
| `brace-expansion` (transitiva, via `minimatch`) | 5.0.6 | 5.0.7 | patch, refresh de resolução |
| `linkify-it` (transitiva, via `markdown-it`) | 5.0.1 | 5.0.2 | patch, arrasto do bump de `markdown-it` |
| `fast-uri` (transitiva, via `ajv`) | 3.1.2 | 3.1.4 | patch, refresh de resolução |
| `js-yaml` (transitiva, via `orval`) | 4.1.1 | 4.3.0 | **override escopado** — ver seção própria abaixo |

`firebase` **não foi alterado** (permanece `12.13.0`, dentro do range `^12.12.1` já
declarado). A vulnerabilidade crítica de `websocket-driver` foi resolvida sem qualquer
atualização do Firebase — o pacote `faye-websocket@0.11.4` (já fixado por
`@firebase/database@1.1.3`, versão estável mais recente da submódulo Realtime Database)
declara `websocket-driver: ">=0.5.1"`, uma faixa aberta que já permitia a versão corrigida;
o lockfile apenas fixava uma resolução antiga (0.7.4) dentro dessa mesma faixa. Um
`pnpm update websocket-driver` bastou.

## Advisories tratados

| Pacote | Severidade | Advisory | Status |
|--------|------------|----------|--------|
| `websocket-driver` | critical | [GHSA-xv26-6w52-cph6](https://github.com/advisories/GHSA-xv26-6w52-cph6) | ✅ Corrigido |
| `vite` | high | [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) | ✅ Corrigido |
| `brace-expansion` | high | [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp) | ✅ Corrigido |
| `js-yaml` | high | [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) | ✅ Corrigido (via override) |
| `linkify-it` | high | [GHSA-v245-v573-v5vm](https://github.com/advisories/GHSA-v245-v573-v5vm) | ✅ Corrigido |
| `fast-uri` (host confusion via IDN) | high | [GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6) | ✅ Corrigido |
| `fast-uri` (host confusion via backslash) | high | [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) | ✅ Corrigido |

## Advisories ainda pendentes (fora do escopo desta sessão — abaixo do limiar high)

| Pacote | Severidade | Caminho | Observação |
|--------|------------|---------|------------|
| `protobufjs` (2 advisories) | moderate | `firebase → @firebase/firestore → @grpc/grpc-js → @grpc/proto-loader → protobufjs` | Cadeia do Firestore via gRPC; não coberto pelo escopo desta sessão (somente high/critical da issue #12) |
| `esbuild` | low | `artifacts/api-server`, e transitiva via `vite` | Leitura arbitrária de arquivo no dev server em Windows; baixo impacto, dev-only |
| `@babel/core` | low | `artifacts/emdia → @vitejs/plugin-react → @babel/core` | Leitura arbitrária via sourceMappingURL; dev-only |
| `body-parser` | low | `artifacts/api-server → express → body-parser` | DoS por limite de tamanho mal configurado; pacote fora do escopo da issue #12 |

Nenhuma dessas atinge o limiar "high" tratado pela issue #12. Recomenda-se um
acompanhamento futuro (nova issue ou ampliação do escopo de #12) caso se decida elevar o
padrão para incluir moderate/low.

## Impacto em runtime

- Nenhuma das dependências corrigidas é usada em código de produção além do próprio
  `firebase` (cujo componente vulnerável, `faye-websocket`/`websocket-driver`, já era
  comprovadamente inatingível no bundle do cliente — resolvido via campo `browser` do
  `package.json` de `@firebase/database`, verificado em sessão anterior).
- `vite` é uma ferramenta de build, nunca embarcada no bundle.
- `orval`, `typedoc`, `markdown-it`, `minimatch`, `brace-expansion`, `linkify-it`,
  `fast-uri` e `js-yaml` são exclusivamente devDependencies usadas pelo script manual
  `codegen` de `lib/api-spec` — nunca invocado por `build`, `typecheck` ou qualquer suíte
  de teste.

## Resultado dos 159 testes

| Suíte | Testes | Resultado |
|-------|--------|-----------|
| `test:finance` | 25 | Pass |
| `test:ui` | 9 | Pass |
| `test:today-data` | 25 | Pass |
| `test:financial-context` | 54 | Pass |
| `test:prepare-month` | 46 | Pass |
| **Total único** | **159** | **Pass** |

## Resultado do build

`pnpm --filter "./artifacts/emdia" run build` — aprovado (mesmos warnings pré-existentes de
sourcemap/chunk size, não relacionados a esta remediação).

## Decisão sobre overrides

Um único override foi aplicado, em `pnpm-workspace.yaml`:

```yaml
overrides:
  orval>js-yaml: ^4.3.0
```

**Justificativa:** `orval@8.22.0` (a versão mais recente disponível, já adotada nesta
remediação) fixa `js-yaml` em exatamente `"4.2.0"` — uma versão exata, sem faixa — que
ainda está abaixo do limiar corrigido (`>=4.3.0`). Não existe versão de `orval` que resolva
isso sem um override, pois mesmo o último release da ferramenta mantém esse pin. O override
foi **escopado exclusivamente à aresta `orval>js-yaml`** (não é um override global de
`js-yaml`), minimizando o raio de impacto — nenhum outro pacote do projeto depende de
`js-yaml`. A troca (`4.2.0` → `4.3.0`) é um bump de patch dentro da mesma major, e o próprio
changelog do `js-yaml` documenta essa versão como a correção de segurança pontual, sem
mudanças de API. Testado: os 159 testes e o build passam sem alteração — o script `codegen`
que de fato invoca `orval`/`js-yaml` nunca é executado pelo pipeline de build/test/CI, então
o risco de regressão é nulo para a validação automatizada; o benefício é remover a
vulnerabilidade para quem rodar `codegen` manualmente no futuro.

Nenhum outro override foi necessário ou aplicado.

## Relação com a issue #12

Esta remediação resolve **todas** as vulnerabilidades high e critical identificadas e
rastreadas pela issue #12 (`websocket-driver`, `vite`, `brace-expansion`, `js-yaml`), além
de 3 vulnerabilidades high adicionais que surgiram na base de advisories entre sessões
(`linkify-it`, `fast-uri` ×2), sem exigir nenhuma atualização major, nenhuma mudança
funcional e nenhum override de risco elevado. Os itens moderate/low remanescentes ficam
documentados como risco residual conhecido, fora do escopo original da issue.
