import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Heart, Shield, Grid2x2, Maximize2, ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';
import HeroSlider from '../components/HeroSlider';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../hooks/useProducts';
import { getOrganizationSchema, getWebSiteSchema, getFAQSchema, getHomepageFAQs } from '../utils/schemas';

const faqs = getHomepageFAQs();

const Home: React.FC = () => {
  const { products, loading, error } = useProducts();
  const [featuredViewMode, setFeaturedViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [newViewMode, setNewViewMode] = useState<'grid' | 'fullscreen'>('grid');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const featuredProducts = products.filter(product => product.featured).slice(0, 4);
  const newProducts = products.filter(product => product.new).slice(0, 4);

  const schemas = {
    '@context': 'https://schema.org',
    '@graph': [
      getOrganizationSchema(),
      getWebSiteSchema(),
      getFAQSchema(faqs),
    ],
  };

  return (
    <div className="min-h-screen">
      <SEO
        title="Malas de Croché Feitas à Mão em Portugal"
        description="Loja online de malas de croché feitas à mão em Portugal. Prendas artesanais para mulher, acessórios de croché artesanais para oferecer e decoração de sala em croché artesanal. Peças únicas com qualidade premium."
        canonical="/"
        ogType="website"
        schema={schemas}
      />

      {/* Hero Slider */}
      <HeroSlider />

      {/* Keyword-rich intro — visible text for Google + user trust */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            Na <strong>Arte em Ponto</strong>, cada{' '}
            <strong>mala de croché feita à mão em Portugal</strong> leva entre{' '}
            <strong>8 a 15 horas de trabalho artesanal</strong> — um detalhe que
            não encontra em produções em série. Criamos{' '}
            <strong>prendas artesanais para mulher feitas à mão</strong>,{' '}
            <strong>acessórios de croché artesanais para oferecer</strong> e{' '}
            <strong>decoração de sala em croché artesanal</strong> que transforma
            qualquer espaço com autenticidade portuguesa. Também aceitamos{' '}
            <Link to="/contacto" className="text-primary-600 hover:underline font-medium">
              bolsas de croché personalizadas por encomenda
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Produtos em Destaque
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Seleção especial das nossas peças mais populares e procuradas
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">A carregar produtos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <>
          {/* View Mode Toggle - Mobile Only */}
          <div className="flex justify-center mb-6 sm:hidden">
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setFeaturedViewMode('grid')}
                className={`p-2 ${featuredViewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                title="2x2 Grid"
              >
                <Grid2x2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setFeaturedViewMode('fullscreen')}
                className={`p-2 ${featuredViewMode === 'fullscreen' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                title="Tela Cheia"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {featuredViewMode === 'fullscreen' ? (
            <div className="sm:hidden space-y-6 mb-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode="fullscreen" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={featuredViewMode} />
              ))}
            </div>
          )}

          <div className="text-center">
            <Link
              to="/loja"
              className="inline-flex items-center px-6 py-3 border border-primary-600 text-primary-600 font-medium rounded-md hover:bg-primary-50 transition-colors"
            >
              Ver Todos os Produtos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          </>
          )}
        </div>
      </section>

      {/* New Products - Only show if there are new products */}
      {!loading && !error && newProducts.length > 0 && (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Novidades
            </h2>
            <p className="text-lg text-gray-600">
              As mais recentes criações do nosso ateliê
            </p>
          </div>

          {(
            <>
          {/* View Mode Toggle - Mobile Only */}
          <div className="flex justify-center mb-6 sm:hidden">
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                onClick={() => setNewViewMode('grid')}
                className={`p-2 ${newViewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                title="2x2 Grid"
              >
                <Grid2x2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setNewViewMode('fullscreen')}
                className={`p-2 ${newViewMode === 'fullscreen' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                title="Tela Cheia"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {newViewMode === 'fullscreen' ? (
            <div className="sm:hidden space-y-6">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode="fullscreen" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={newViewMode} />
              ))}
            </div>
          )}
          </>
          )}
        </div>
      </section>
      )}

      {/* Features */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: 2 columns then 1 full width */}
          <div className="md:hidden grid grid-cols-2 gap-4">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 mb-3 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  Feito à Mão
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Cada peça criada com amor e dedicação
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 mb-3 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  Qualidade Premium
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Materiais de alta qualidade
                </p>
              </div>
            </div>

            {/* Feature 3 - Full width */}
            <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-4 max-w-sm mx-auto">
                <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    Peças Únicas
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Designs exclusivos que não encontra em mais lugar nenhum
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Feito à Mão
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Cada peça é cuidadosamente criada à mão com amor e dedicação
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Qualidade Premium
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Utilizamos apenas materiais de alta qualidade e técnicas tradicionais
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Peças Únicas
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Designs exclusivos que não encontra em mais lugar nenhum
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para Descobrir?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Explore a nossa coleção completa de produtos de croché artesanais feitos à mão em Portugal
          </p>
          <Link
            to="/loja"
            className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-md hover:bg-gray-100 hover:shadow-lg hover:scale-105 transition-all duration-300 group"
          >
            Explorar Loja
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* FAQ Section — targets "People Also Ask" queries + FAQ rich result */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Perguntas Frequentes
            </h2>
            <p className="text-gray-600">
              Tudo o que precisa de saber sobre os nossos produtos artesanais
            </p>
          </div>

          <div className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-primary-600 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;