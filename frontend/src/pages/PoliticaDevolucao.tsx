import React, { useState } from 'react';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

const PoliticaDevolucao: React.FC = () => {
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const { lang: uiLang } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
        <SEO
          title="Política de Devolução | Return Policy"
          description="Política de devolução de 14 dias da Recicloth. 14-day return policy."
          canonical={getRoutePath('returnPolicy', uiLang)}
        />
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Language toggle */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setLang('pt')}
            className={`px-4 py-1.5 text-sm border rounded-full transition-colors ${lang === 'pt' ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'text-[#2D6A4F] border-[#2D6A4F] hover:bg-[#2D6A4F]/10'}`}
          >
            Português
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-4 py-1.5 text-sm border rounded-full transition-colors ${lang === 'en' ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'text-[#2D6A4F] border-[#2D6A4F] hover:bg-[#2D6A4F]/10'}`}
          >
            English
          </button>
        </div>

        {lang === 'pt' ? (
          <div className="space-y-8 text-[#1A1A1A] leading-relaxed">
            <h1 className="text-4xl font-bold">Política de Devolução</h1>

            <section>
              <p className="text-sm text-gray-500 mb-4">Prazo: <strong>14 dias seguidos</strong> a contar da data de receção da encomenda (Direito de Livre Resolução da UE).</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Condições</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>A peça deve estar no mesmo estado em que foi enviada (sem sinais de uso adicional, lavagem ou odores).</li>
                <li>Manutenção das etiquetas originais da loja.</li>
                <li>Por serem peças de segunda mão/recicladas, pequenas marcas de desgaste natural (mencionadas na descrição do produto) não são consideradas defeitos.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Custos</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Por conta do cliente:</strong> Em caso de desistência ou erro no tamanho.</li>
                <li><strong>Por conta da loja:</strong> Se a peça apresentar um defeito não mencionado ou se for enviado o artigo errado.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Reembolso</h2>
              <p className="text-sm">Após receção e verificação do artigo devolvido, o reembolso será processado no prazo máximo de 14 dias, utilizando preferencialmente o mesmo método de pagamento utilizado na compra inicial.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Como Iniciar uma Devolução</h2>
              <p className="text-sm">Para iniciar uma devolução, contacte-nos em <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a> com o número de encomenda e o motivo da devolução.</p>
            </section>

            <section className="bg-[#F2E8DC] rounded-lg p-5 text-sm">
              <p>Responderemos com os próximos passos e a morada de devolução. Recomendamos o envio com número de rastreio.</p>
            </section>
          </div>
        ) : (
          <div className="space-y-8 text-[#1A1A1A] leading-relaxed">
            <h1 className="text-4xl font-bold">Return Policy</h1>

            <section>
              <p className="text-sm text-gray-500 mb-4">Period: <strong>14 consecutive days</strong> from the date of receipt of the order (EU Right of Withdrawal).</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Conditions</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>The item must be in the same condition as sent (no signs of additional use, washing, or odours).</li>
                <li>Original store tags must be kept attached.</li>
                <li>As these are second-hand/recycled items, minor signs of natural wear (mentioned in the product description) are not considered defects.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Costs</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Customer's responsibility:</strong> In case of withdrawal or sizing error.</li>
                <li><strong>Store's responsibility:</strong> If the item has an unmentioned defect or the wrong item was sent.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Refunds</h2>
              <p className="text-sm">After receiving and verifying the returned item, the refund will be processed within a maximum of 14 days, preferably using the same payment method used in the original purchase.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">How to Start a Return</h2>
              <p className="text-sm">To start a return, contact us at <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a> with your order number and the reason for return.</p>
            </section>

            <section className="bg-[#F2E8DC] rounded-lg p-5 text-sm">
              <p>We will reply with the next steps and the return address. We recommend sending with a tracking number.</p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliticaDevolucao;
