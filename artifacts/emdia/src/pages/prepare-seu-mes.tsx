import { PrepareMonthPage } from "@/features/prepare-month";

/**
 * Prepare seu mês — feature GA (sem feature flag).
 * A feature flag VITE_ENABLE_PREPARE_MONTH foi removida nesta versão.
 * A rota está sempre acessível para usuários autenticados.
 */
export default function PrepareSeuMes() {
  return <PrepareMonthPage />;
}
