import React, { useState } from 'react';
import SEO from '../components/SEO';

const TermosCondicoes: React.FC = () => {
  const [lang, setLang] = useState<'pt' | 'en'>('pt');

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <SEO
        title="Termos e Condições | Terms & Conditions"
        description="Termos e condições de utilização da Recicloth. Terms and conditions of use."
        canonical="/termos-condicoes"
      />
      <div className="max-w-4xl mx-auto px-4 py-12">

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
          <div className="space-y-10 text-[#1A1A1A] leading-relaxed">
            <h1 className="text-4xl font-bold">Termos e Condições</h1>

            <section>
              <h2 className="text-xl font-bold mb-3">Regras de Utilização</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Propriedade Intelectual:</strong> Todas as fotografias das peças recicladas e o design do site pertencem à Recicloth.</li>
                <li><strong>Uso Indevido:</strong> É proibido o uso de bots para compra automática ou qualquer tentativa de comprometer a segurança do site.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Condições de Compra</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Stock:</strong> Como trabalhamos com roupa reciclada, a maioria das peças são únicas. Em caso de erro de stock simultâneo, a primeira encomenda paga terá prioridade, sendo feito o reembolso total à segunda.</li>
                <li><strong>Preços:</strong> Os preços incluem IVA à taxa legal em vigor. Os custos de envio são somados no checkout.</li>
                <li><strong>Pagamento:</strong> Aceitação de métodos seguros (MB Way, Transferência Bancária ou Cartão).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Limitação de Responsabilidade</h2>
              <p className="text-sm">A Recicloth não se responsabiliza por danos indiretos, lucros cessantes ou perdas de dados resultantes da utilização do site. A responsabilidade máxima da Recicloth fica limitada ao valor da encomenda em causa.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Lei Aplicável e Jurisdição</h2>
              <p className="text-sm">Os presentes Termos e Condições são regidos pela lei portuguesa. Em caso de litígio, é competente o tribunal da comarca de Vila Nova de Gaia, sem prejuízo do recurso a meios alternativos de resolução de litígios.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Resolução de Litígios Online (ODR)</h2>
              <p className="text-sm mb-3">Nos termos do Regulamento (UE) n.º 524/2013, informamos que os consumidores da União Europeia podem recorrer à Plataforma de Resolução de Litígios em Linha (ODR) da Comissão Europeia:</p>
              <ul className="text-sm space-y-1">
                <li>Plataforma ODR: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">https://ec.europa.eu/consumers/odr</a></li>
                <li>E-mail para efeitos de ODR: <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a></li>
              </ul>
            </section>
          </div>
        ) : (
          <div className="space-y-10 text-[#1A1A1A] leading-relaxed">
            <h1 className="text-4xl font-bold">Terms &amp; Conditions</h1>

            <section>
              <h2 className="text-xl font-bold mb-3">Usage Rules</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Intellectual Property:</strong> All photographs of recycled items and the site design belong to Recicloth.</li>
                <li><strong>Misuse:</strong> The use of bots for automatic purchasing or any attempt to compromise the security of the site is strictly prohibited.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Purchase Conditions</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Stock:</strong> As we work with recycled clothing, most items are unique. In the event of a simultaneous stock error, the first paid order takes priority and a full refund will be issued to the second.</li>
                <li><strong>Prices:</strong> All prices include VAT at the legally applicable rate. Shipping costs are added at checkout.</li>
                <li><strong>Payment:</strong> Secure payment methods accepted (MB Way, Bank Transfer, or Card).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Limitation of Liability</h2>
              <p className="text-sm">Recicloth is not liable for indirect damages, loss of profits, or data loss resulting from the use of the website. Recicloth's maximum liability is limited to the value of the order in question.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Governing Law &amp; Jurisdiction</h2>
              <p className="text-sm">These Terms and Conditions are governed by Portuguese law. In the event of a dispute, the courts of Vila Nova de Gaia shall have jurisdiction, without prejudice to recourse to alternative dispute resolution mechanisms.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Online Dispute Resolution (ODR)</h2>
              <p className="text-sm mb-3">Under Regulation (EU) No. 524/2013, we inform EU consumers that they may use the European Commission's Online Dispute Resolution (ODR) platform to resolve consumer disputes:</p>
              <ul className="text-sm space-y-1">
                <li>ODR Platform: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">https://ec.europa.eu/consumers/odr</a></li>
                <li>E-mail for ODR purposes: <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a></li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermosCondicoes;
