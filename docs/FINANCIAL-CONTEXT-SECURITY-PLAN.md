# Plano de Segurança - Contexto Financeiro

## Regras e Validações Previstas (Firestore Rules)

As regras de segurança (`firestore.rules`) ainda não foram alteradas nesta etapa, mas o plano abaixo direcionará a implementação futura:

1. **Ownership Estrito**: 
   - Acesso restrito a `request.auth.uid == userId` para leitura e escrita em `users/{userId}/financialContext/current`.
   - Proibição absoluta de utilizar um UID recebido no payload do frontend como confiável. Sempre utilizar `request.auth.uid`.

2. **Tipagem e Limites (Validação de Schema via Rules)**:
   - **Centavos**: Campos financeiros (`amountInCents`, `minimumReserveInCents`, etc.) devem ser `int` (inteiros). Isso previne injeção de strings ou floats que quebram o Decision Engine.
   - **Datas Civis**: Campos de data (`date`, `expectedDate`, `dueDate`) devem ser `string` com limite de caracteres para `YYYY-MM-DD` (ex: 10 caracteres) ou usar validação de regex (se suportado nas rules no futuro) ou ser validado rigidamente no Backend/Cloud Function se as rules não suportarem regex complexa (por hora, o tamanho da string é mitigador).
   - **Campos Permitidos**: A escrita deve permitir estritamente chaves conhecidas do contrato `FinancialProfile` para prevenir que o cliente injete campos indesejados (`allow only these fields`).

3. **Prevenção de Escrita Cruzada**:
   - Uma regra `write` em `users/{uid}/financialContext/current` deve garantir que nenhum outro nó seja impactado pela mesma requisição.

4. **Tamanho do Documento**:
   - Garantir via frontend que os arrays de rendas, compromissos e metas tenham limite razoável (ex: max 100 itens cada) para não ferir o limite de 1MB do Firestore, e não tornar a renderização impossível. Em caso de abuso (payload > X KB), a regra do Firestore bloqueará o acesso.

5. **Exclusão Segura e Auditoria**:
   - Impedir a operação `delete` física no documento de contexto. O estado atual é atualizado.
   - Idempotência: writes sequenciais de mesmo estado não geram anomalias financeiras.
   - O histórico de alterações do Contexto (quando necessário auditar) deverá ser feito sem logs de valores sensíveis na nuvem ou deverá utilizar Cloud Audit Logs.

6. **Testes Futuros**:
   - Todo este plano deverá ser implementado sob TDD no `Firebase Local Emulator`, garantindo que um usuário A não acesse B, e que dados corrompidos (strings ao invés de inteiros) sejam rejeitados com `Permission Denied`.
