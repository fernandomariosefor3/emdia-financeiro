import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-4 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a página inicial
          </Button>
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidade</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">Última atualização: Julho de 2026</p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Sobre o Em Dia Financeiro</h2>
            <p className="text-gray-600 mb-4">
              O Em Dia Financeiro é um aplicativo de organização financeira. Coletamos e armazenamos 
              seus dados financeiros para fornecer as funcionalidades de controle de despesas e receitas.
              Utilizamos a infraestrutura do Google Firebase para armazenamento, garantindo padrões 
              modernos de segurança da informação.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Integração com WhatsApp (Lia)</h2>
            <p className="text-gray-600 mb-4">
              Nossa assistente financeira via WhatsApp, a Lia, <strong>ainda não está ativamente integrada</strong>. 
              Ela se encontra em fase de preparação ("acesso antecipado"). 
              Quando o recurso for lançado, vincularemos o seu número de telefone de forma explícita 
              à sua conta. A Lia atuará exclusivamente como uma interface de chat para os dados que 
              já estão na sua conta. Ela não toma decisões autônomas, não possui aprendizado comportamental ("machine learning" ativo sobre seus hábitos), 
              e atua estritamente seguindo suas ordens e configurações.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Coleta e Uso de Dados</h2>
            <p className="text-gray-600 mb-4">
              Coletamos seu endereço de email (para login), nome, e os lançamentos financeiros 
              que você registra voluntariamente. Não solicitamos senhas bancárias e 
              não nos conectamos diretamente ao seu banco por Open Finance. Toda inserção 
              é manual ou feita por comandos de chat quando a integração com WhatsApp estiver disponível.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Retenção e Exclusão</h2>
            <p className="text-gray-600 mb-4">
              Seus dados são armazenados de forma segura enquanto a sua conta existir. 
              Você pode, a qualquer momento, solicitar a exclusão permanente de todos os seus 
              dados e da sua conta entrando em contato com nosso suporte.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Contato</h2>
            <p className="text-gray-600 mb-4">
              Para dúvidas sobre esta política, contate nossa equipe de suporte através do número 
              de WhatsApp informado no rodapé da página inicial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
