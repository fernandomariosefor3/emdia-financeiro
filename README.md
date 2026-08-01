# emdia — Sua Assessora Financeira no WhatsApp

emdia ajuda brasileiros a controlarem as finanças sem planilha. A proposta central é uma assessora financeira via WhatsApp, apoiada por um app web com um motor de decisão que responde à pergunta que importa: **"posso gastar isso hoje?"**.

> **Status do WhatsApp:** a integração está desenvolvida e testada, mas a ativação depende do número oficial e das credenciais da Meta (ver `docs/RELATORIO-MELHORIAS-EMDIA.md`). O app web já está funcional.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19.1-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.12-orange)

## Planos

| Recurso                  | Gratuito       | Pro (R$6,58/mês) | Empresas      |
|--------------------------|:--------------:|:----------------:|:-------------:|
| Transações/mês           | 15             | Ilimitadas       | Ilimitadas    |
| Categorias               | 5              | Ilimitadas       | Ilimitadas    |
| Histórico                | 30 dias        | Completo         | Completo      |
| Exportação CSV           | —              | ✓                | ✓             |
| Relatórios mensais       | —              | ✓                | ✓             |
| Sincronização na nuvem   | —              | ✓                | ✓             |
| Backup histórico         | —              | ✓                | ✓             |
| Multi-usuários           | —              | +1 familiar      | Até 5         |
| Integração ERP           | —              | —                | ✓             |
| SLA dedicado             | —              | —                | ✓             |
| Suporte                  | E-mail         | Prioritário      | Dedicado      |
| Preço anual              | Grátis         | R$78,99/ano      | Sob consulta  |

> Plano Pro: 7 dias de garantia + cancelamento fácil a qualquer momento.

---

## Funcionalidades

- **Tela Hoje (motor de decisão)** — Calcula seu "respiro" (quanto sobra com segurança), ritmo diário seguro, riscos próximos e uma ação recomendada, tudo em centavos para evitar erros de arredondamento. É a experiência principal do dashboard.
- **Preparar seu Mês** — Assistente que confirma saldo de referência, reserva mínima, rendas esperadas, contas recorrentes e metas protegidas, alimentando o motor de decisão com dados reais.
- **Simulador de Compra** — "Posso gastar R$ X?" com impacto projetado no respiro e nos compromissos essenciais.
- **Dashboard Financeiro** — Receitas, despesas, gráficos (pizza/barras), insights de categoria e comparação mês a mês.
- **Registro por IA** — Cadastre um gasto em linguagem natural (Firebase Functions + OpenAI).
- **Assessora no WhatsApp** *(em ativação)* — Consultas de saldo/gastos e simulação por mensagem, com webhook idempotente.
- **Autenticação Segura** — Login com Firebase Auth (email/senha).
- **Exportação CSV / Relatórios Premium** — Recursos do plano Pro.
- **Responsivo & PWA** — Funciona em desktop e mobile; instalável como app.

## Tecnologias

### Frontend
- **React 19** — Framework UI
- **TypeScript** — Tipagem estática
- **Vite** — Build tool ultrarrápido
- **Tailwind CSS 4** — Estilização utilitária
- **Recharts** — Gráficos interativos
- **Wouter** — Roteamento leve
- **TanStack Query** — Gerenciamento de estado servidor

### Backend
- **Firebase Auth** — Autenticação
- **Cloud Firestore** — Banco de dados NoSQL
- **Firebase Functions** — Registro por IA (OpenAI), billing (Stripe) e webhook do WhatsApp (Meta)
- **Firebase Hosting** — Hospedagem CDN global

### DevOps
- **pnpm** — Gerenciamento de pacotes
- **GitHub Actions** — CI/CD automatizado
- **TypeScript** — Verificação de tipos

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- Conta no Firebase
- Conta no GitHub (para CI/CD)

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/fernandomariosefor3/emdia-financeiro.git
cd emdia-financeiro

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```env
VITE_FIREBASE_API_KEY=sua-api-key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
VITE_FIREBASE_APP_ID=seu-app-id
```

## Scripts

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Preview do build
pnpm serve

# Verificação de tipos
pnpm typecheck

# Verificação completa (lint + types)
pnpm run build
```

## Estrutura do Projeto

```
emdia-financeiro/
├── artifacts/
│   ├── emdia/              # Aplicação React principal
│   │   ├── src/
│   │   │   ├── components/ # Componentes reutilizáveis
│   │   │   ├── lib/        # Contextos e hooks
│   │   │   ├── pages/      # Páginas da aplicação
│   │   │   └── App.tsx     # Componente raiz
│   │   └── dist/           # Build de produção
│   └── api-server/         # Servidor API (futuro)
├── lib/
│   └── integrations/       # Integrações externas
├── scripts/                # Scripts de automação
├── .github/
│   └── workflows/          # Pipelines CI/CD
├── firestore.rules         # Regras de segurança
└── firebase.json           # Configuração Firebase
```

## Segurança

### Regras do Firestore

As regras de segurança estão em `firestore.rules` e garantem:

- Cada usuário acessa apenas seus próprios dados
- Validação de email para mensagens de contato
- Proteção contra campos arbitrários
- Rate limiting implícito

### Boas Práticas

- Nunca commite arquivos `.env`
- Use Secrets do GitHub para variáveis sensíveis
- Mantenha dependências atualizadas
- Execute `pnpm typecheck` antes de commit

## Deploy

### Deploy Automático (GitHub Actions)

O projeto está configurado para deploy automático:

| Branch | Ambiente | URL |
|--------|----------|-----|
| `main` | Produção | https://emdiafinanceiro.com.br |
| `develop` | Staging | https://staging.emdiafinanceiro.com.br |

### Deploy Manual

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy
firebase deploy
```

## Contribuindo

1. Fork o repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Roadmap

**Curto prazo (go-live)**
- [ ] Ativar WhatsApp: número oficial + credenciais Meta e deploy das Functions
- [ ] Ativar billing Stripe (plano Founder) em produção
- [ ] Atualizar runtime das Firebase Functions (Node 20 → 22)

**Concluído recentemente**
- [x] Tela Hoje conectada ao contexto financeiro confirmado (motor de decisão)
- [x] "Preparar seu Mês" (GA)

**Futuro**
- [ ] Autenticação em 2 fatores (2FA)
- [ ] Integração com Open Banking (PIX)
- [ ] App nativo iOS/Android
- [ ] Previsão de gastos com ML

## Suporte

- **Email:** emdiacontrolefinanceiro@gmail.com
- **WhatsApp:** (85) 98743-6263
- **Issues:** https://github.com/fernandomariosefor3/emdia-financeiro/issues

## Licença

MIT License — © 2024 Fernando Mário

---
19/07/2026
Feito com 💚 para ajudar brasileiros a controlarem suas finanças
