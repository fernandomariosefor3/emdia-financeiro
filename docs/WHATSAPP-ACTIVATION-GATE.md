# Checklist de Ativação do WhatsApp

Este documento contém os pré-requisitos para a ativação oficial da integração WhatsApp Business. 
A integração **está atualmente bloqueada** porque o número de telefone oficial do Em Dia Financeiro ainda não foi adquirido e configurado.

## Requisitos de Ativação (Etapas Bloqueantes)

- [ ] **1. Aquisição do Número:** Adquirir um número de telefone dedicado para uso exclusivo da Lia no WhatsApp.
- [ ] **2. Criação do App Meta:** Criar aplicativo na plataforma Meta for Developers (Tipo Business) e adicionar o produto WhatsApp.
- [ ] **3. Vínculo da Conta:** Vincular o número de telefone ao WhatsApp Business Account (WABA) recém-criado.
- [ ] **4. Geração de Token:** Gerar um Token de Acesso Permanente na Meta para que as Cloud Functions possam disparar mensagens.
- [ ] **5. Configuração de Secrets:** Inserir os seguintes secrets no ambiente do Firebase Functions de produção:
  - `META_WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_LINK_CODE_SECRET` (para assinar os links do app)
- [ ] **6. Configuração de Variáveis:** Atualizar as variáveis de ID no código ou secrets de produção:
  - `META_WABA_ID`
  - `META_WHATSAPP_PHONE_NUMBER_ID`
  - `META_WHATSAPP_VERIFY_TOKEN` (usado para validar o webhook)
- [ ] **7. Validação do Webhook:** Na Meta for Developers, cadastrar a URL da function `whatsappWebhook` e validá-la com o Verify Token.
- [ ] **8. Ativação do Frontend:** No painel da Vercel (Produção), configurar `VITE_ENABLE_WHATSAPP_LINK=true`.
- [ ] **9. Adequação da Homepage:** Mudar o CTA de "Acesso Antecipado" para efetivamente direcionar ao WhatsApp.
- [ ] **10. Número de Suporte:** Ajustar o número de suporte humano na página caso conflita com a nova estrutura.

---
**IMPORTANTE:**
- Não faça deploy de secrets falsos.
- Não aponte botões para APIs não validadas em produção.
- Todos esses passos dependem única e exclusivamente da Etapa 1.
