import React from 'react';
import SEO from '../components/SEO';

const PoliticaPrivacidade: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <SEO
        title="Política de Privacidade"
        description="Política de privacidade da Recicloth em conformidade com o RGPD."
        canonical="/politica-privacidade"
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-6">Política de Privacidade</h1>
        <div className="space-y-4 text-[#1A1A1A] leading-relaxed">
          <p>
            A Recicloth compromete-se a proteger os seus dados pessoais, em conformidade com o
            Regulamento Geral sobre a Proteção de Dados (RGPD).
          </p>
          <p>
            Recolhemos apenas os dados necessários para processar encomendas, prestar apoio ao cliente
            e melhorar os nossos serviços.
          </p>
          <p>
            Tem o direito de aceder, retificar, apagar ou limitar o tratamento dos seus dados.
            Para exercer estes direitos, contacte-nos através do email de suporte.
          </p>
          <p>
            Os dados são conservados apenas pelo período necessário às finalidades legais, fiscais
            e operacionais associadas à atividade da loja.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
