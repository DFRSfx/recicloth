import React from 'react';
import SEO from '../components/SEO';

const PoliticaDevolucao: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <SEO
        title="Política de Devolução"
        description="Política de devolução de 14 dias da Recicloth."
        canonical="/politica-devolucao"
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-6">Política de Devolução</h1>
        <div className="space-y-4 text-[#1A1A1A] leading-relaxed">
          <p>
            Na Recicloth, dispõe de 14 dias após a receção da encomenda para solicitar a devolução.
          </p>
          <p>
            O artigo deve ser devolvido no mesmo estado em que foi entregue, sem sinais adicionais
            de uso, com etiqueta (quando aplicável) e embalagem original.
          </p>
          <p>
            Após validação do estado do produto, o reembolso será processado pelo mesmo método de
            pagamento, no prazo legal aplicável.
          </p>
          <p>
            Custos de envio da devolução podem ser suportados pelo cliente, salvo erro de expedição
            ou defeito do artigo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoliticaDevolucao;
