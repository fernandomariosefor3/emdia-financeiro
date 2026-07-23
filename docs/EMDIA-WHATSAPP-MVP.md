# Emdia no Zap — MVP

Documenta o que está implementado nesta fase. Para a visão de produto de
longo prazo, veja [`EMDIA-WHATSAPP-VISION.md`](./EMDIA-WHATSAPP-VISION.md).

## Arquitetura

```
functions/index.ts               → entry point das Cloud Functions (Gen 2)
functions/src/whatsapp/
  webhook.ts                     → whatsappWebhook (GET verify + POST message)
  linking.ts                     → createWhatsAppLinkCode, getWhatsAppConnectionStatus,
                                    disconnectWhatsApp
  commands.ts                    → fluxo SIM/NÃO, escrita idempotente da transação
  parser.ts                      → interpretação de texto (regex + palavras-chave)
  queries.ts                     → W5: motor de respiro/ritmo/simulação (backend)
  categories.ts                  → sugestão de categoria (regex + palavras-chave)
  signature.ts                   → validação HMAC SHA-256
  verification.ts               → handshake GET da Meta
  sendMessage.ts                → envio de mensagem via WhatsApp Cloud API
  secrets.ts                    → defineSecret dos 5 segredos
  types.ts
  __tests__/

artifacts/emdia/src/features/whatsapp-link/
  WhatsAppLinkPage.tsx            → UI (estados visuais)
  useWhatsAppLink.ts               → máquina de estados do cliente
  whatsappLinkClient.ts            → chamadas httpsCallable
  types.ts
  __tests__/
artifacts/emdia/src/pages/whatsapp-preview.tsx  → gate por feature flag
```

`functions/` é implantado separadamente do workspace pnpm do app web (não
está listado em `pnpm-workspace.yaml`) — por isso seus tipos e sua lógica
de domínio (parser, categorias, comandos) são **autocontidos**: não há
import cruzado com `artifacts/emdia/src/domain/finance/commands`. Os dois
módulos compartilham o mesmo *conceito* de comando financeiro, mas não o
mesmo código, porque a Firebase CLI empacota e implanta `functions/` de
forma isolada, sem visibilidade sobre o resto do monorepo.

## Functions exportadas

| Function | Tipo | Autenticação |
|---|---|---|
| `whatsappWebhook` | `onRequest` (HTTP) | validado por assinatura HMAC, não por Firebase Auth |
| `createWhatsAppLinkCode` | `onCall` | obrigatória (`request.auth`) |
| `getWhatsAppConnectionStatus` | `onCall` | obrigatória (`request.auth`) |
| `disconnectWhatsApp` | `onCall` | obrigatória (`request.auth`) |

Todas exportadas a partir de `functions/src/whatsapp/index.ts` e
reexportadas por `functions/index.ts` (o entry point real do pacote —
`functions/src/index.ts` não existe neste layout).

## Coleções utilizadas

Todas acessadas exclusivamente pelo Admin SDK (nunca pelo cliente web):

- `whatsappLinkCodes/{hash}` — código de vínculo (apenas o hash HMAC, nunca o código em texto puro), `expiresAt`, `used`.
- `whatsappLinks/{waId}` — vínculo confirmado, `{ uid, linkedAt }`.
- `whatsappPendingCommands/{waId}` — comando aguardando confirmação SIM/NÃO.
- `whatsappProcessedMessages/{messageId}` — deduplicação de reentregas do webhook.
- `users/{uid}/transactions` — **schema já existente**, reaproveitado sem alterações (`amount` em reais, `type`, `category`, `description`, `date` `YYYY-MM-DD`, `createdAt`).

## Fluxo de vinculação

1. Usuário autenticado abre "Emdia no Zap" no app e clica em "Gerar código".
2. `createWhatsAppLinkCode` gera um código de 6 dígitos, grava `HMAC(code, WHATSAPP_LINK_CODE_SECRET)` como ID do documento (nunca o código em si), com `expiresAt` = agora + 10 minutos e `used: false`. Retorna o código em texto puro **apenas** nessa resposta, ao próprio usuário autenticado.
3. Usuário envia `VINCULAR 123456` pelo WhatsApp.
4. O webhook calcula o mesmo hash e verifica, em uma **transaction**: existe, não expirou, não foi usado. Se válido, marca `used: true` e cria `whatsappLinks/{waId}`.
5. App pode consultar `getWhatsAppConnectionStatus` a qualquer momento para saber se já vinculou.

## Mensagens aceitas

Sem IA — apenas regex e palavras-chave determinísticas:

- Despesa: `gastei`, `paguei`, `comprei`, `gasto de`, `saiu`.
- Receita: `recebi`, `ganhei`, `caiu`, `entrou`, `recebimento de`.
- Valor: primeiro número reconhecido na mensagem (aceita `38`, `38,50`, `1.200`, `1.200,50`, com ou sem `R$`).
- Categoria: sugerida por palavras-chave na descrição (mesmo vocabulário de categorias já usado por `processarGastoComIA`); usa "Outros (saída)"/"Outros (entrada)" quando nada corresponde.

## Confirmação SIM/NÃO

Nenhuma mensagem é registrada sem confirmação explícita:

1. Mensagem nova e reconhecível → cria `whatsappPendingCommands/{waId}` e responde com o que foi entendido, pedindo SIM ou NÃO.
2. Resposta **SIM** (ou variações: `sim`, `s`, `confirmo`, `confirmar`, `ok`) → grava a transação em `users/{uid}/transactions` e apaga o pendente, em uma única transaction (nunca cria duas transações mesmo sob concorrência).
3. Resposta **NÃO** (ou `nao`, `n`, `cancelar`, `cancela`) → apaga o pendente sem gravar nada.
4. Qualquer outra resposta → mantém o pendente e pede para responder SIM ou NÃO novamente.

## Idempotência

- **Por `messageId`**: toda mensagem recebida do webhook só é processada uma vez (`whatsappProcessedMessages`, `create()` atômico — reentregas da Meta são silenciosamente ignoradas).
- **Por `commandId`/confirmação**: confirmar o mesmo comando pendente duas vezes nunca grava duas transações — a segunda confirmação encontra o pendente já removido e não faz nada.
- **Código de vínculo**: uso único, garantido por transaction (`used: true` verificado e marcado atomicamente).

## Interface protegida por feature flag

`VITE_ENABLE_WHATSAPP_LINK` — somente o valor literal `"true"` ativa a
rota `/whatsapp-preview`; qualquer outro valor (ausente, vazio, `"1"`
etc.) redireciona para `/dashboard`. A flag permanece **ausente/desligada
em produção** nesta fase. A rota segue o mesmo padrão de
`/today-preview` e `/prepare-month-preview`: acessível diretamente pela
URL, ainda sem link visível no dashboard.

Estados visuais: recurso desativado (redirect), não conectado, gerando
código, código gerado / aguardando vinculação, conectado, desconectando,
erro.

## Os cinco secrets (nomes apenas — nenhum valor configurado)

- `META_WHATSAPP_ACCESS_TOKEN`
- `META_WHATSAPP_APP_SECRET`
- `META_WHATSAPP_VERIFY_TOKEN`
- `META_WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_LINK_CODE_SECRET`

Todos declarados via `defineSecret` (`functions/src/whatsapp/secrets.ts`)
e lidos apenas em tempo de execução (`.value()`), nunca hardcoded, nunca
em `.env` versionado, nunca em testes, nunca em log.

## Configuração futura do webhook da Meta (fora do escopo desta fase)

1. Criar app e número de teste no Meta for Developers;
2. `firebase functions:secrets:set` para cada um dos cinco nomes acima;
3. Configurar a URL pública de `whatsappWebhook` implantada como webhook no painel da Meta, usando o mesmo `META_WHATSAPP_VERIFY_TOKEN`.

Nenhum desses passos foi executado nesta fase.

## Privacidade

- O UID nunca vem do payload do WhatsApp nem do formulário — só de `request.auth` (callables) ou do vínculo já confirmado em `whatsappLinks` (webhook).
- `getWhatsAppConnectionStatus` retorna apenas `connected`, `maskedPhone` (últimos 4 dígitos) e `connectedAt` — nunca o número completo.
- Logs do webhook nunca incluem o payload completo, o texto da mensagem, nem valores financeiros.
- O número de telefone nunca é usado como única prova de identidade — a vinculação exige o código gerado dentro do app autenticado.

## Como desconectar

No app, em "Emdia no Zap", botão "Desconectar WhatsApp" → chama
`disconnectWhatsApp` (autenticado, localizado por `request.auth.uid`,
nunca por um identificador vindo do cliente). Remove o vínculo e qualquer
comando pendente órfão daquele número. Operação idempotente: chamar de
novo depois de já desconectado continua respondendo com sucesso.

## Limitações do parser (nesta fase)

- Reconhece apenas o **primeiro** valor numérico da mensagem — frases com múltiplos números podem ser mal interpretadas.
- Não interpreta datas em texto livre (ex.: "para dia 10") — toda transação usa a data de recebimento da mensagem.
- Não reconhece sinônimos além da lista fixa de palavras-chave.
- Uma única confirmação pendente por número por vez.

## Confirmação: ainda não há IA externa

O parser (`parser.ts`) e o categorizador (`categories.ts`) são 100%
regex/palavras-chave determinísticas. Nenhuma chamada a OpenAI, Gemini ou
qualquer outro provedor de IA existe neste módulo (a única função do
projeto que usa IA, `processarGastoComIA` em `functions/index.ts`, é
anterior a esta fase e não foi alterada nem é usada pelo WhatsApp).


---

## W5: Consultas de Respiro pelo WhatsApp

Implementado no módulo `queries.ts` — motor de cálculo financeiro 100% backend,
sem dependência do domínio frontend. Suporta duas modalidades:

### Consulta pura de respiro

**Keywords aceitas:**
- `quanto posso gastar`
- `qual meu respiro`
- `meu respiro`
- `como ta minha vida`
- `como ta minhas financas/financia`
- `situação`
- `resumo`
- `saldo atual`
- `tô bem` / `to bem`

**Fluxo:**
1. `parseQueryIntent` detecta a intenção de consulta (antes de `parseTransactionIntent`)
2. `getFinancialPulse(uid, db)` busca transações do Firestore e calcula respiro + ritmo
3. `formatPulseResponse` monta a resposta em texto
4. Enviada via `sendWhatsAppTextMessage`

**Resposta enviada:**
```
🌟 Situação: Saudável

💰 Respiro: Você tem R$ 1.240 livres
📊 Ritmo: Pode gastar até R$ 68 por dia
📅 Próxima renda em 18 dias

💵 Saldo do mês: R$ 2.400 (R$ 2.400 entrada, R$ 1.160 saída)

Digite "simular 350" para testar uma compra.
```

### Simulação de compra

**Keywords aceitas:**
- `simular <valor>`
- `e se eu gastar <valor>`
- `se eu gastar <valor>`
- `posso comprar <valor>`
- `posso gastar <valor>`

**Funcionalidades:**
- Extrai valor da mensagem (aceita `350`, `350,00`, `1.200,50`)
- Detecta forma de pagamento (à vista / parcelado)
- Detecta número de parcelas (`3x`, `em 6 vezes`)
- Monta cenário com `buildSimulation`
- Responde com veredito, comparativo antes/depois e risco

**Resposta enviada:**
```
✅ Tudo certo! Seu respiro aguenta essa compra.

💸 Compra: R$ 350 (À vista)
   Descrição: Tênis

📊 Seu respiro:
   Antes: R$ 1.240
   Depois: R$ 890 (-R$ 350)

📈 Ritmo diário:
   Antes: R$ 68/dia
   Depois: R$ 49/dia (-R$ 19)
```

**Vereditos:**
- `🚨 Cuidado!` — respiro fica negativo
- `⚠️ Atenção!` — respiro cai abaixo de 10% das despesas
- `✅ Tudo certo!` — respiro aguenta a compra

### Motor de cálculo (`queries.ts`)

O módulo replica a lógica do domínio frontend (`domain/finance/`) para rodar
100% no backend:

- `getFinancialPulse` — busca transações do Firestore, calcula respiro,
  ritmo diário, próxima renda, classificação de saúde
- `buildSimulation` — simula impacto de uma compra (à vista ou parcelada)
- `formatPulseResponse` — formata resposta de consulta
- `formatSimulationResponse` — formata resposta de simulação

**Dados usados:**
- Coleção `users/{uid}/transactions` — transações do mês atual e próximo
- Sem necessidade de `financialContext` (usa transações reais)
- Sem IA externa — cálculo determinístico

### Limitações do W5

- Não considera metas de reserva mínima (usa `protectedAmount = 0`)
- Compromissos futuros não registrados como transação não são considerados
- Parcelas avançam ~30 dias por parcela (pode não refletir datas reais)
- Uma única simulação por vez (mesmo flow que transações — mesma limitação)