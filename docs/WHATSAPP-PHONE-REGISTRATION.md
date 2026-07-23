# Emdia no Zap — Cadastro do telefone

Checklist operacional para o dia em que o chip do WhatsApp Business for
comprado e ativado. Antes deste checklist, nenhuma etapa exige ação —
`VITE_ENABLE_WHATSAPP_LINK` permanece `false`/ausente em produção, e nenhum
telefone, token ou secret real foi configurado.

Para a arquitetura e as functions já implementadas, veja
[`EMDIA-WHATSAPP-MVP.md`](./EMDIA-WHATSAPP-MVP.md). Para a visão de produto,
veja [`EMDIA-WHATSAPP-VISION.md`](./EMDIA-WHATSAPP-VISION.md).

## Checklist

- [ ] **1. Comprar e ativar o chip** dedicado ao WhatsApp Business (número
      que nunca foi usado em um WhatsApp pessoal ou Business App comum).
- [ ] **2. Verificar o número por SMS ou ligação** durante o cadastro no
      Meta Business Manager / WhatsApp Manager.
- [ ] **3. Cadastrar o número na Meta**, associando-o a um WhatsApp Business
      Account (WABA) dentro do app da Meta já usado (ou criado) para o
      Emdia.
- [ ] **4. Obter o Phone Number ID** do número recém-cadastrado no painel da
      Meta (WhatsApp Manager → Números de telefone).
- [ ] **5. Configurar os secrets** rodando
      [`scripts/setup-whatsapp-phone.ps1`](../scripts/setup-whatsapp-phone.ps1):
      - `META_WHATSAPP_ACCESS_TOKEN`
      - `META_WHATSAPP_APP_SECRET`
      - `META_WHATSAPP_VERIFY_TOKEN`
      - `META_WHATSAPP_PHONE_NUMBER_ID`
      - `WHATSAPP_LINK_CODE_SECRET`

      O script nunca recebe esses valores por parâmetro, nunca os grava em
      arquivo e nunca os imprime — cada um é digitado diretamente no prompt
      seguro do Firebase CLI.
- [ ] **6. Implantar somente as Functions do WhatsApp**, usando a mesma
      confirmação explícita dentro do script (`whatsappWebhook`,
      `createWhatsAppLinkCode`, `getWhatsAppConnectionStatus`,
      `disconnectWhatsApp`) — nenhuma outra function ou o hosting é tocado
      neste passo.
- [ ] **7. Cadastrar a URL do webhook** (`https://<região>-<projeto>.cloudfunctions.net/whatsappWebhook`,
      ou o domínio customizado se houver) no painel da Meta, usando o mesmo
      valor de `META_WHATSAPP_VERIFY_TOKEN` configurado no passo 5.
- [ ] **8. Assinar o evento `messages`** no webhook (WhatsApp Manager →
      Configuração → Webhooks → Gerenciar). Sem essa assinatura, nenhuma
      mensagem recebida chega à function.
- [ ] **9. Testar de ponta a ponta com o número real:**
      - [ ] enviar `VINCULAR 123456` com um código gerado no app e confirmar
            que a resposta de vínculo chega;
      - [ ] enviar uma mensagem de despesa (ex.: "gastei 38 no mercado") e
            confirmar que o bot pede confirmação;
      - [ ] responder `SIM` e confirmar que a transação aparece em
            `/transacoes` com o schema real (`amount`, `type`, `category`,
            `description`, `date`, `createdAt`);
      - [ ] reenviar a mesma mensagem de confirmação (ou simular retry) e
            confirmar que a transação não é duplicada.
- [ ] **10. Ativar a interface somente depois dos testes acima passarem**,
      definindo `VITE_ENABLE_WHATSAPP_LINK: "true"` no step de build do
      workflow de deploy (`.github/workflows/deploy.yml`) e publicando uma
      nova versão do app.

## O que este checklist não cobre

- Configuração de cobrança/Stripe — veja
  [`FOUNDER-ANNUAL-PLAN.md`](./FOUNDER-ANNUAL-PLAN.md).
- Qualquer alteração de DNS ou domínio.
- Deploy manual fora do fluxo acima — o hosting continua sendo publicado
  apenas pelo pipeline de CI/CD em `main`.
