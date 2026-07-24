import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Termos de Uso</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">Última atualização: Julho de 2026</p>
            
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Aceitação</h2>
            <p className="text-gray-600 mb-4">
              Ao acessar e utilizar o aplicativo Em Dia Financeiro, você concorda com estes termos. 
              O aplicativo é fornecido "no estado em que se encontra", focado no controle de despesas 
              pessoais.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Natureza do Serviço</h2>
            <p className="text-gray-600 mb-4">
              A Lia é um assistente virtual em desenvolvimento para ajudar você a registrar suas 
              transações financeiras e consultá-las. <strong>Ela não substitui aconselhamento financeiro 
              profissional.</strong> As análises, classificações de risco e alertas baseiam-se puramente 
              nos valores inseridos por você e regras pré-definidas, não constituindo recomendação 
              de investimento, empréstimo ou diagnóstico atuarial definitivo.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Acesso Antecipado e WhatsApp</h2>
            <p className="text-gray-600 mb-4">
              A integração com WhatsApp está atualmente em fase de preparação ("acesso antecipado"). 
              Recursos de mensagens automatizadas, alertas diários e processamento via IA podem 
              passar por instabilidades inerentes a este estágio, ou podem estar indisponíveis. 
              O uso da inteligência artificial pode ocasionalmente gerar categorizações inexatas que 
              devem ser conferidas pelo usuário.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Segurança e Responsabilidade</h2>
            <p className="text-gray-600 mb-4">
              Aplicamos esforços contínuos de engenharia para manter a plataforma estável e seus 
              dados protegidos. Não garantimos conformidade com padrões bancários fechados 
              ("segurança bancária" ou ISOs certificadas que não foram auditadas externamente).
              Não nos responsabilizamos por perdas financeiras decorrentes do uso da ferramenta 
              para tomada de decisões. O usuário é o único responsável pela veracidade dos 
              dados inseridos no sistema.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Modificações</h2>
            <p className="text-gray-600 mb-4">
              Podemos modificar estes termos a qualquer momento, atualizando esta página. 
              Mudanças em precificações ou planos (como o Plano Fundador) não afetarão o 
              ciclo de cobrança vigente sem aviso prévio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
