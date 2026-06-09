# emdia — Controle Financeiro Pessoal

Plataforma moderna de gestão financeira pessoal desenvolvida com React, TypeScript e Firebase.

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

- **Dashboard Financeiro** — Visualize suas receitas, despesas e dívidas em tempo real
- **Gestão de Transações** — Registro rápido de entradas e saídas com limite por plano
- **Gráficos Interativos** — Gráficos de pizza e barras para análise visual
- **Autenticação Segura** — Login com Firebase Auth (email/senha)
- **Exportação CSV** — Exporte seus dados para declaração de IR (plano Pro)
- **Relatórios Premium** — Análise por mês, trimestre e ano (plano Pro)
- **Responsivo** — Funciona perfeitamente em desktop e mobile
- **PWA** — Instale como app no seu celular

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

- [ ] Autenticação em 2 fatores (2FA)
- [ ] Dashboard de investimentos
- [ ] Integração com Open Banking (PIX)
- [ ] App nativo iOS/Android
- [ ] Relatórios mensais automatizados
- [ ] Previsão de gastos com ML
- [ ] Gamificação

## Suporte

- **Email:** emdiacontrolefinanceiro@gmail.com
- **WhatsApp:** (85) 98743-6263
- **Issues:** https://github.com/fernandomariosefor3/emdia-financeiro/issues

## Licença

MIT License — © 2024 Fernando Mário

---

Feito com 💚 para ajudar brasileiros a controlarem suas finanças