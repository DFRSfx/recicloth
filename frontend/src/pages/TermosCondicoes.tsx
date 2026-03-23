import React from 'react';
import SEO from '../components/SEO';

const TermosCondicoes: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <SEO
        title="Termos e Condições"
        description="Termos e condições da loja Recicloth."
        canonical="/termos-condicoes"
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[#1A1A1A] mb-6">Termos e Condições</h1>
        <div className="space-y-4 text-[#1A1A1A] leading-relaxed">
          <p>
            Ao utilizar a loja Recicloth, concorda com os presentes termos e condições.
          </p>
          <p>
            Os preços apresentados incluem IVA à taxa legal em vigor. Os custos de envio são
            apresentados no checkout, de acordo com o país de destino.
          </p>
          <p>
            A Recicloth reserva-se o direito de atualizar disponibilidade, preços e descrições
            dos produtos sem aviso prévio, sem prejuízo dos direitos adquiridos em encomendas já confirmadas.
          </p>
          <p>
            Em caso de litígio, aplica-se a legislação portuguesa, sem prejuízo de meios alternativos
            de resolução de litígios de consumo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermosCondicoes;
