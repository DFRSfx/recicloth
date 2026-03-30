import React, { useState } from 'react';
import SEO from '../components/SEO';

const PoliticaPrivacidade: React.FC = () => {
  const [lang, setLang] = useState<'pt' | 'en'>('pt');

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <SEO
        title="Política de Privacidade | Privacy Policy"
        description="Política de privacidade e proteção de dados da Recicloth (RGPD). Privacy policy and GDPR information."
        canonical="/politica-privacidade"
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
            <h1 className="text-4xl font-bold">Política de Privacidade &amp; RGPD</h1>

            <section>
              <h2 className="text-xl font-bold mb-3">Responsável pelo Tratamento de Dados</h2>
              <ul className="text-sm space-y-1">
                <li><strong>Responsável:</strong> Recicloth</li>
                <li><strong>Contacto:</strong> <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a></li>
                <li><strong>Morada:</strong> Vila Nova de Gaia, Porto, Portugal</li>
              </ul>
              <p className="text-sm mt-3 text-gray-600">Para qualquer questão relacionada com os seus dados pessoais, pode contactar-nos através do e-mail indicado acima.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Política de Privacidade &amp; Consentimento</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Recolha de Dados:</strong> Apenas os dados necessários para o envio (Nome, Morada, NIF, Email e Telefone).</li>
                <li><strong>Finalidade:</strong> Processamento de encomendas, emissão de faturas e apoio ao cliente.</li>
                <li><strong>Consentimento:</strong> No pop-up de newsletter, existe uma checkbox desmarcada que o utilizador deve marcar ativamente: <em>"Aceito receber comunicações de marketing e novidades sobre moda sustentável"</em>. Não é possível subscrever sem aceitar. O silêncio não é consentimento.</li>
                <li><strong>Direitos:</strong> O utilizador pode pedir a retificação ou eliminação dos seus dados a qualquer momento enviando um e-mail para <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Período de Conservação de Dados</h2>
              <p className="text-sm">Os dados pessoais associados a encomendas e faturas são conservados por um período de <strong>5 (cinco) anos</strong>, conforme exigido pela legislação fiscal e contabilística portuguesa. Após este período, os dados serão eliminados de forma segura.</p>
              <p className="text-sm mt-2">Os dados de marketing (caso o utilizador tenha dado consentimento) são conservados até que o utilizador retire o seu consentimento.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Subcontratantes e Transferências Internacionais</h2>
              <p className="text-sm mb-3">Para a prestação dos nossos serviços, recorremos aos seguintes subcontratantes, que podem processar dados pessoais em servidores fora da União Europeia:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Supabase Inc. (EUA)</strong> — Base de dados e armazenamento. Cumpre o Data Privacy Framework UE-EUA.</li>
                <li><strong>Vercel Inc. (EUA)</strong> — Alojamento web e infraestrutura. Cumpre o RGPD através de cláusulas contratuais-tipo.</li>
                <li><strong>Stripe Inc. (EUA)</strong> — Processamento de pagamentos. Certificado PCI-DSS e conforme com o RGPD.</li>
                <li><strong>PostHog Inc. (EUA)</strong> — Análise de produto e comportamento de utilizadores. Dados anonimizados.</li>
                <li><strong>Google LLC (EUA)</strong> — Google Analytics 4 para estatísticas de tráfego. Sujeito ao consentimento de cookies analíticos.</li>
              </ul>
              <p className="text-sm mt-3 text-gray-600">Todas as transferências para países terceiros são efetuadas com garantias adequadas nos termos do Artigo 46.º do RGPD.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Direitos dos Titulares de Dados</h2>
              <p className="text-sm mb-3">Nos termos do RGPD, o utilizador tem direito a:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Acesso aos seus dados pessoais</li>
                <li>Retificação de dados incorretos</li>
                <li>Eliminação dos dados ("direito a ser esquecido")</li>
                <li>Limitação do tratamento</li>
                <li>Portabilidade dos dados</li>
                <li>Oposição ao tratamento para fins de marketing</li>
              </ul>
              <p className="text-sm mt-3">Para exercer qualquer um destes direitos, contacte-nos em <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a>. Responderemos no prazo máximo de 30 dias.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Direito de Reclamação — CNPD</h2>
              <p className="text-sm mb-3">Se considerar que o tratamento dos seus dados pessoais viola o RGPD, tem o direito de apresentar uma reclamação junto da CNPD:</p>
              <ul className="text-sm space-y-1">
                <li><strong>Comissão Nacional de Proteção de Dados (CNPD)</strong></li>
                <li>Website: <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">www.cnpd.pt</a></li>
                <li>E-mail: <a href="mailto:geral@cnpd.pt" className="text-[#2D6A4F] underline">geral@cnpd.pt</a></li>
                <li>Morada: Rua de São Bento, 148-3.º, 1200-821 Lisboa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Aviso de Cookies</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Essenciais:</strong> Necessários para o carrinho de compras e login funcionar (não podem ser desativados).</li>
                <li><strong>Analíticos:</strong> Para sabermos quantas pessoas visitam a loja (ex: Google Analytics, PostHog). Requerem consentimento ativo.</li>
                <li><strong>Marketing:</strong> Para mostrar publicidade personalizada. Requerem consentimento ativo.</li>
              </ul>
              <p className="text-sm mt-3 font-semibold">Os cookies analíticos e de marketing NÃO são carregados automaticamente. O utilizador deve aceitar explicitamente através do banner de cookies apresentado na primeira visita.</p>
            </section>
          </div>
        ) : (
          <div className="space-y-10 text-[#1A1A1A] leading-relaxed">
            <h1 className="text-4xl font-bold">Privacy Policy &amp; GDPR</h1>

            <section>
              <h2 className="text-xl font-bold mb-3">Data Controller</h2>
              <ul className="text-sm space-y-1">
                <li><strong>Controller:</strong> Recicloth</li>
                <li><strong>Contact:</strong> <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a></li>
                <li><strong>Address:</strong> Vila Nova de Gaia, Porto, Portugal</li>
              </ul>
              <p className="text-sm mt-3 text-gray-600">For any questions regarding your personal data, please contact us at the e-mail address listed above.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Privacy Policy &amp; Consent</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Data Collected:</strong> Only data necessary for shipping (Name, Address, Tax ID, Email, and Phone).</li>
                <li><strong>Purpose:</strong> Order processing, invoice issuance, and customer support.</li>
                <li><strong>Consent:</strong> In the newsletter pop-up, there is an unchecked box that the user must actively tick: <em>"I agree to receive marketing communications and updates about sustainable fashion"</em>. Subscribing is not possible without accepting. Silence does not constitute consent.</li>
                <li><strong>Rights:</strong> Users may request rectification or deletion of their data at any time by emailing <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Data Retention Period</h2>
              <p className="text-sm">Personal data associated with orders and invoices is retained for a period of <strong>5 (five) years</strong>, as required by Portuguese tax and accounting legislation. After this period, data will be securely deleted.</p>
              <p className="text-sm mt-2">Marketing data (where the user has given consent) is retained until the user withdraws their consent.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Sub-processors &amp; International Transfers</h2>
              <p className="text-sm mb-3">To deliver our services, we rely on the following sub-processors, who may process personal data on servers outside the European Union:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Supabase Inc. (USA)</strong> — Database and storage. Complies with EU-US Data Privacy Framework.</li>
                <li><strong>Vercel Inc. (USA)</strong> — Web hosting and infrastructure. GDPR-compliant via Standard Contractual Clauses.</li>
                <li><strong>Stripe Inc. (USA)</strong> — Payment processing. PCI-DSS certified and GDPR compliant.</li>
                <li><strong>PostHog Inc. (USA)</strong> — Product analytics and user behaviour. Data is anonymised.</li>
                <li><strong>Google LLC (USA)</strong> — Google Analytics 4 for traffic statistics. Subject to analytical cookie consent.</li>
              </ul>
              <p className="text-sm mt-3 text-gray-600">All transfers to third countries are carried out with adequate safeguards under Article 46 of the GDPR.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Data Subject Rights</h2>
              <p className="text-sm mb-3">Under the GDPR, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Access your personal data</li>
                <li>Rectification of inaccurate data</li>
                <li>Erasure of data ("right to be forgotten")</li>
                <li>Restriction of processing</li>
                <li>Data portability</li>
                <li>Objection to processing for marketing purposes</li>
              </ul>
              <p className="text-sm mt-3">To exercise any of these rights, contact us at <a href="mailto:suporte@recicloth.pt" className="text-[#2D6A4F] underline">suporte@recicloth.pt</a>. We will respond within a maximum of 30 days.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Right to Lodge a Complaint — CNPD</h2>
              <p className="text-sm mb-3">If you believe that the processing of your personal data violates the GDPR, you have the right to lodge a complaint with the competent supervisory authority in Portugal:</p>
              <ul className="text-sm space-y-1">
                <li><strong>Comissão Nacional de Proteção de Dados (CNPD)</strong> — Portuguese Data Protection Authority</li>
                <li>Website: <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-[#2D6A4F] underline">www.cnpd.pt</a></li>
                <li>Email: <a href="mailto:geral@cnpd.pt" className="text-[#2D6A4F] underline">geral@cnpd.pt</a></li>
                <li>Address: Rua de São Bento, 148-3.º, 1200-821 Lisboa, Portugal</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-3">Cookie Notice</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Essential:</strong> Required for the shopping cart and login to function (cannot be disabled).</li>
                <li><strong>Analytical:</strong> To understand how many people visit the store (e.g. Google Analytics, PostHog). Require active consent.</li>
                <li><strong>Marketing:</strong> To show personalised advertising. Require active consent.</li>
              </ul>
              <p className="text-sm mt-3 font-semibold">Analytical and marketing cookies are NOT loaded automatically. The user must explicitly accept them through the cookie consent banner shown on first visit.</p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
