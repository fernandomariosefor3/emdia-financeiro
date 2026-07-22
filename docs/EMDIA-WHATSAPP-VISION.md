# Emdia no Zap — Visão

Este documento descreve a visão de produto para o futuro canal de WhatsApp.
Nenhuma parte deste documento implica integração ativa com Meta, WhatsApp ou
inteligência artificial externa nesta fase — apenas os contratos de domínio
channel-neutral (`domain/finance/commands`) já existem, sem conexão externa.

## Objetivo

Permitir que o usuário converse com o Emdia pelo WhatsApp para registrar e
consultar sua vida financeira.

## Exemplos

"Gastei 38 no mercado."
"Recebi 1.200 do trabalho."
"Quanto posso gastar hoje?"
"Se eu comprar algo de 350, fico apertado?"
"Anota aluguel de 900 para dia 10."

## Fluxo seguro

1. mensagem recebida;
2. identificação segura da conta;
3. interpretação;
4. criação de comando pendente;
5. validação;
6. confirmação do usuário;
7. gravação;
8. resposta com impacto no Respiro.

Cada comando nasce como um `FinancialCommand` (`source: "whatsapp"`,
`confirmationStatus: "pending"`). Nenhuma etapa deste fluxo grava diretamente
a partir da interpretação da mensagem — a gravação só acontece depois do
passo 6, usando exatamente a mesma regra de confirmação que o canal web usa
(`canApplyCommand`, `confirmCommand`). Não existe atalho de gravação direta
para o WhatsApp.

## Regras

- nunca gravar valor ambíguo;
- sempre confirmar despesa ou receita;
- não pedir senha bancária;
- não aceitar número de telefone como única prova de identidade;
- vincular WhatsApp à conta por código temporário gerado no app;
- evitar duplicação usando o ID da mensagem;
- registrar auditoria sem expor conteúdo financeiro desnecessário;
- permitir desconectar o WhatsApp;
- respeitar exclusão de dados e privacidade.

## Fases futuras

- W1: configuração Meta e número de teste;
- W2: webhook somente leitura;
- W3: interpretação de texto;
- W4: confirmação e gravação;
- W5: consultas de Respiro e Ritmo;
- W6: mensagens de voz;
- W7: lembretes autorizados.

## Estado atual

Implementado:

- contratos puros em `artifacts/emdia/src/domain/finance/commands`
  (`FinancialCommand`, validação, `canApplyCommand`, `confirmCommand`,
  `rejectCommand`, checagem de duplicidade por `commandId`);
- MVP funcional do backend em `functions/src/whatsapp/`: webhook do WhatsApp
  (`whatsappWebhook`), vinculação de conta (`createWhatsAppLinkCode` +
  `VINCULAR 123456`), interpretação de texto por regras simples (sem IA),
  sugestão de categoria, fluxo de confirmação SIM/NÃO, e gravação da
  transação em `users/{uid}/transactions` (schema real, reaproveitado tal
  como já existia) somente após confirmação explícita;
- deduplicação por `messageId` do WhatsApp, para que reentregas do webhook
  (comuns na API da Meta) nunca dupliquem uma transação;
- todos os segredos (token de acesso, app secret, verify token, phone
  number id, segredo do código de vinculação) via Firebase Secret Manager —
  nenhum valor real foi configurado nesta fase.

Não implementado ainda (fases W5 em diante): consultas de Respiro/Ritmo,
mensagens de voz, lembretes autorizados, e qualquer chamada a inteligência
artificial externa (o parser é 100% baseado em palavras-chave e regex).

## Checklist operacional (fora do escopo desta fase — apenas para referência)

Para ativar de fato, um operador humano precisa, fora deste repositório:

1. Criar o app e o número de teste no Meta for Developers;
2. `firebase functions:secrets:set META_WHATSAPP_ACCESS_TOKEN`;
3. `firebase functions:secrets:set META_WHATSAPP_APP_SECRET`;
4. `firebase functions:secrets:set META_WHATSAPP_VERIFY_TOKEN`;
5. `firebase functions:secrets:set META_WHATSAPP_PHONE_NUMBER_ID`;
6. `firebase functions:secrets:set WHATSAPP_LINK_CODE_SECRET`;
7. Configurar a URL do `whatsappWebhook` implantado como webhook no painel
   da Meta, usando o mesmo `META_WHATSAPP_VERIFY_TOKEN`.

Nenhum desses comandos foi executado nesta fase.
