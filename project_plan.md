# EmDia Financeiro

## 1. Project Description
Aplicativo web completo de acompanhamento financeiro pessoal chamado **EmDia Financeiro**. Permite que usuários registrem receitas, despesas, controlem dívidas/parcelamentos, criem metas de economia, categorizem transações e obtenham insights através de relatórios e um assistente de IA.

**Público-alvo:** Pessoas que querem controlar suas finanças pessoais de forma simples e visual.
**Core value:** Controle financeiro intuitivo com gráficos, metas, dívidas e assistente IA, tudo em um app moderno.

## 2. Page Structure
- `/` — Landing page (site institucional)
- `/auth` — Login e cadastro (e-mail, Google)
- `/app` — Aplicativo SPA com sub-views:
  - `dashboard` — Resumo financeiro, cards, gráficos
  - `transactions` — Lista completa de transações com filtros
  - `categories` — Gerenciamento de categorias
  - `accounts` — Gerenciamento de contas financeiras
  - `goals` — Metas de economia
  - `debts` — Dívidas e parcelamentos
  - `reports` — Relatórios com gráficos
  - `settings` — Configurações
  - `profile` — Perfil do usuário
- `/admin` — Painel administrativo

## 3. Core Features
- [x] Autenticação (e-mail + Google OAuth) via Supabase Auth
- [x] Landing page com marketing
- [x] Dashboard com resumo financeiro e gráficos
- [x] Transações (CRUD, filtros, export CSV)
- [x] Categorias personalizadas (CRUD, ícones, cores) — visual com dados
- [x] Contas financeiras (CRUD, saldos) — visual com dados
- [x] Metas de economia (CRUD, progresso) — visual com dados
- [x] Dívidas/parcelamentos (CRUD, progresso, alertas) — visual com dados
- [x] Relatórios (comparativos, ranking, impressão) — visual com dados
- [ ] Assistente Lia (chat flutuante com IA)
- [x] Upgrade Pro via Stripe
- [x] Painel admin

## 4. Data Model Design

### Table: transactions (existente)
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK -> auth.users |
| type | text | receita / despesa / divida |
| amount | numeric | Valor |
| description | text | Descrição |
| category | text | Categoria |
| date | text | Data (YYYY-MM-DD) |
| due_date | text | Vencimento (YYYY-MM-DD) |
| account_id | uuid? | FK -> accounts |
| created_at | timestamptz | Timestamp |

### Table: categories (nova)
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK -> auth.users |
| name | text | Nome da categoria |
| icon | text | Emoji/ícone |
| color | text | Cor hex |
| type | text | receita / despesa |
| created_at | timestamptz | Timestamp |

### Table: accounts (nova)
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK -> auth.users |
| name | text | Nome da conta |
| type | text | corrente / poupanca / carteira / credito / outro |
| bank | text? | Nome do banco |
| initial_balance | numeric | Saldo inicial |
| current_balance | numeric | Saldo atual (calculado) |
| created_at | timestamptz | Timestamp |

### Table: goals (nova)
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK -> auth.users |
| name | text | Nome da meta |
| target_amount | numeric | Valor alvo |
| current_amount | numeric | Valor atual |
| deadline | text? | Prazo (YYYY-MM-DD) |
| status | text | em_andamento / concluida / atrasada |
| created_at | timestamptz | Timestamp |

### Table: debts (nova)
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK -> auth.users |
| name | text | Nome/nickname |
| creditor | text | Nome do credor |
| total_amount | numeric | Valor total |
| installment_value | numeric | Valor da parcela |
| total_installments | int | Total de parcelas |
| paid_installments | int | Parcelas pagas |
| start_date | text | Data início (YYYY-MM-DD) |
| interest_rate | numeric? | Taxa de juros (%) |
| created_at | timestamptz | Timestamp |

### Table: user_profiles (existente)
| Field | Type | Description |
|-------|------|-------------|
| user_id | uuid | PK |
| name | text | Nome do usuário |
| avatar_color | text | Cor do avatar |
| joined_at | text | Data de cadastro |

### Table: app_settings (existente)
| Field | Type | Description |
|-------|------|-------------|
| user_id | uuid | PK |
| is_pro | boolean | Plano Pro |
| onboarding_done | boolean | Onboarding finalizado |

## 5. Backend / Third-party Integration Plan
- **Supabase Auth:** Autenticação (e-mail, Google OAuth)
- **Supabase Database:** Armazenamento de todos os dados (transactions, categories, accounts, goals, debts, profiles, settings)
- **Supabase RLS:** Segurança row-level para isolamento por usuário
- **Stripe:** Pagamentos para plano Pro (já configurado)
- **Edge Functions:** Checkout e webhook Stripe (já existentes)
- **Anthropic Claude:** Assistente IA (future)

## 6. Development Phase Plan

### Phase 1: Banco de Dados + Novo Layout ✅
- Goal: Criar tabelas faltantes e reconstruir layout do app com nova identidade visual
- Deliverable: App com sidebar/topbar e 9 views navegáveis com dados reais do banco
- Status: Completo — tabelas `categories`, `accounts`, `goals`, `debts` criadas com RLS. Hooks criados. Layout com sidebar escura (#0F2A1E), topbar, bottom nav mobile. Todas 9 views renderizando com dados.

### Phase 2: CRUD Completos (Categorias, Contas, Metas, Dívidas)
- Goal: Adicionar modais de criação/edição/exclusão para categorias, contas, metas e dívidas
- Deliverable: Telas de categorias, contas, metas e dívidas com CRUD completo via modal

### Phase 3: Assistente Lia (IA)
- Goal: Chat flutuante com integração Anthropic Claude
- Deliverable: Botão flutuante no canto inferior direito, janela de chat funcional

### Phase 4: Dashboard Aprimorado + Tela de Transações
- Goal: Gráfico de linha de evolução saldo, gráfico de rosca, saudação personalizada, tela de transações com filtros avançados
- Deliverable: Dashboard com gráficos aprimorados e tela de transações com busca/filtro completo