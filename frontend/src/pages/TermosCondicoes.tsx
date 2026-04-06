import React from 'react';
import SEO from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { getRoutePath } from '../utils/routes';

const TermosCondicoes: React.FC = () => {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
        <SEO
          title="Termos e Condições | Terms & Conditions"
          description="Termos e condições de utilização da Recicloth. Terms and conditions of use."
          canonical={getRoutePath('terms', lang)}
        />
      <div className="max-w-4xl mx-auto px-4 py-12">

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
              <h2 className="text-xl font-bold mb-3">Projeto Académico</h2>
              <p className="text-sm">Este website é um projeto académico e não representa uma loja em funcionamento comercial.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Condições de Compra</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Stock:</strong> Como trabalhamos com roupa reciclada, a maioria das peças são únicas. Em caso de erro de stock simultâneo, a primeira encomenda paga terá prioridade, sendo feito o reembolso total à segunda.</li>
                <li><strong>Preços:</strong> Os preços incluem IVA à taxa legal em vigor. Os custos de envio são somados no checkout.</li>
                <li><strong>Pagamento:</strong> Aceitação de métodos seguros (MB Way, Transferência Bancária ou Cartão).</li>
                <li><strong>Fatura:</strong> A fatura será emitida automaticamente após confirmação da encomenda e enviada para o email indicado pelo cliente.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Como Funciona o Processo de Compra</h2>
              <p className="text-sm">O cliente seleciona os produtos pretendidos e adiciona-os ao carrinho. Após confirmação da encomenda e pagamento, será enviado um email automático com os detalhes da compra.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Confirmação da Encomenda</h2>
              <p className="text-sm">Após receção do pagamento, a Recicloth enviará um email de confirmação com o resumo da encomenda e a respetiva fatura.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Erro de Preço</h2>
              <p className="text-sm">Caso exista erro evidente no preço publicado devido a erro técnico ou humano, a Recicloth reserva-se o direito de cancelar a encomenda e proceder ao reembolso integral do valor pago.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Garantia dos Produtos</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Condições da garantia:</strong> Os produtos físicos vendidos na União Europeia têm uma garantia legal mínima de 3 anos para defeitos de conformidade.</li>
                <li><strong>Como proceder:</strong> Em caso de defeito ou avaria, contacte-nos em <a href="mailto:general@recicloth.com" className="text-[#2D6A4F] underline">general@recicloth.com</a> com o número da encomenda e descrição do problema.</li>
                <li><strong>Garantia legal vs. adicional:</strong> A Recicloth aplica a garantia legal. Não existe garantia adicional, salvo indicação expressa.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Envios e Prazos de Entrega</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Prazo médio:</strong> 2-5 dias úteis em Portugal Continental.</li>
                <li><strong>Transportadora:</strong> CTT.</li>
                <li><strong>Custos de envio:</strong> Apresentados no checkout antes do pagamento.</li>
                <li><strong>Encomenda perdida:</strong> Se a encomenda se perder em transporte, procederemos ao reenvio ou reembolso total.</li>
                <li><strong>Envios internacionais:</strong> Atualmente não realizamos envios internacionais.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Direitos do Consumidor</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Informação clara sobre produtos e preços.</li>
                <li>Receber os produtos adquiridos nas condições anunciadas.</li>
                <li>Exercer o direito de livre resolução no prazo de 14 dias.</li>
                <li>Beneficiar da garantia legal aplicável.</li>
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
                <li>E-mail para efeitos de ODR: <a href="mailto:general@recicloth.com" className="text-[#2D6A4F] underline">general@recicloth.com</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Resolução Alternativa de Litígios (RAL)</h2>
              <p className="text-sm mb-3">Em caso de litígio, o consumidor pode recorrer à seguinte entidade de resolução alternativa de litígios de consumo:</p>
              <ul className="text-sm space-y-1">
                <li><strong>CICAP – Centro de Informação de Consumo e Arbitragem do Porto</strong></li>
                <li>Morada: Rua Damião de Góis, 31 – Loja 6, 4050-225 Porto</li>
                <li>Website: <a href="https://www.cicap.pt" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">www.cicap.pt</a></li>
              </ul>
              <p className="text-sm mt-3 text-gray-600">Mais informações em <a href="https://www.consumidor.gov.pt" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">www.consumidor.gov.pt</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Livro de Reclamações</h2>
              <p className="text-sm">Dispomos de Livro de Reclamações Eletrónico. Para apresentar uma reclamação, aceda a: <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">www.livroreclamacoes.pt</a>.</p>
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
              <h2 className="text-xl font-bold mb-3">Academic Project</h2>
              <p className="text-sm">This website is an academic project and does not represent a commercial store in operation.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Purchase Conditions</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Stock:</strong> As we work with recycled clothing, most items are unique. In the event of a simultaneous stock error, the first paid order takes priority and a full refund will be issued to the second.</li>
                <li><strong>Prices:</strong> All prices include VAT at the legally applicable rate. Shipping costs are added at checkout.</li>
                <li><strong>Payment:</strong> Secure payment methods accepted (MB Way, Bank Transfer, or Card).</li>
                <li><strong>Invoice:</strong> The invoice is issued automatically after order confirmation and sent to the customer’s email address.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">How the Purchase Process Works</h2>
              <p className="text-sm">Customers select the desired products and add them to the cart. After order confirmation and payment, an automatic email is sent with the purchase details.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Order Confirmation</h2>
              <p className="text-sm">Once payment is received, Recicloth will send a confirmation email with the order summary and the invoice.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Price Errors</h2>
              <p className="text-sm">In the event of an obvious pricing error caused by a technical or human mistake, Recicloth reserves the right to cancel the order and fully refund the amount paid.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Product Warranty</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Warranty terms:</strong> Physical products sold in the European Union have a minimum legal warranty of 3 years for lack of conformity.</li>
                <li><strong>How to proceed:</strong> In case of defect or malfunction, contact us at <a href="mailto:general@recicloth.com" className="text-[#2D6A4F] underline">general@recicloth.com</a> with your order number and a description of the issue.</li>
                <li><strong>Legal vs. additional warranty:</strong> Recicloth applies the legal warranty. No additional warranty is offered unless explicitly stated.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Shipping &amp; Delivery Times</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Average delivery time:</strong> 2-5 business days in Mainland Portugal.</li>
                <li><strong>Carrier:</strong> CTT.</li>
                <li><strong>Shipping costs:</strong> Shown at checkout before payment.</li>
                <li><strong>Lost orders:</strong> If the order is lost in transit, we will resend or fully refund.</li>
                <li><strong>International shipping:</strong> Currently not available.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Consumer Rights</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Clear information about products and prices.</li>
                <li>Receive purchased products as advertised.</li>
                <li>Exercise the right of withdrawal within 14 days.</li>
                <li>Benefit from the applicable legal warranty.</li>
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
                <li>E-mail for ODR purposes: <a href="mailto:general@recicloth.com" className="text-[#2D6A4F] underline">general@recicloth.com</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Alternative Dispute Resolution (ADR)</h2>
              <p className="text-sm mb-3">In the event of a dispute, the consumer may contact the following alternative dispute resolution entity:</p>
              <ul className="text-sm space-y-1">
                <li><strong>CICAP – Consumer Information and Arbitration Centre of Porto</strong></li>
                <li>Address: Rua Damião de Góis, 31 – Loja 6, 4050-225 Porto, Portugal</li>
                <li>Website: <a href="https://www.cicap.pt" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">www.cicap.pt</a></li>
              </ul>
              <p className="text-sm mt-3 text-gray-600">More information at <a href="https://www.consumidor.gov.pt" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">www.consumidor.gov.pt</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Complaints Book</h2>
              <p className="text-sm">We have an Electronic Complaints Book. To submit a complaint, please visit: <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">www.livroreclamacoes.pt</a>.</p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermosCondicoes;
