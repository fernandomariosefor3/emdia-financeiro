## Resumo

Conecta o protótipo da Tela Hoje às transações reais do usuário em modo exclusivamente leitura.

## Arquitetura

- repositório autenticado;
- mapeadores puros;
- isolamento do Decision Engine;
- UID obtido somente pelo Firebase Authentication;
- nenhuma operação de escrita.

## Tratamento financeiro

- transações passadas formam o saldo registrado;
- receitas futuras viram receitas esperadas;
- despesas futuras viram compromissos;
- proteção contra dupla contagem;
- valores convertidos para centavos;
- Respiro identificado como estimativa;
- qualidade e limitações dos dados exibidas.

## Segurança

- nenhuma escrita no Firestore;
- nenhuma alteração nas regras;
- nenhuma chamada à OpenAI;
- nenhuma chamada a Functions;
- nenhuma fixture como fallback silencioso;
- nenhuma ativação em produção;
- nenhum deploy manual.

## Testes

- 25 testes financeiros;
- 9 testes visuais;
- 25 testes de dados (incluindo repositório, hooks, mapeadores, modos de fallback);
- Total de 59 testes executados;
- typecheck;
- build;
- validação no CI.

## Fora do escopo

- gravação de transações;
- metas persistidas;
- saldo inicial;
- integração bancária;
- Lia;
- OpenAI;
- WhatsApp;
- Open Finance;
- pagamentos.
