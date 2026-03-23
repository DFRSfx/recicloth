import React from 'react';
import { Heart, Users, Award, Sparkles } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Sobre a Recicloth
            </h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Onde cada ponto conta uma história e cada peça é feita com amor e dedicação
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Nossa História */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                A Nossa História
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  A <span className="font-semibold text-primary-600">Recicloth</span> nasceu da paixão pelo crochê
                  e do desejo de criar peças únicas que trazem conforto, beleza e alegria para o seu lar.
                </p>
                <p>
                  Cada criação é cuidadosamente elaborada à mão, com atenção aos mínimos detalhes.
                  Utilizamos apenas materiais de alta qualidade, selecionados com carinho para garantir
                  que cada peça seja durável e especial.
                </p>
                <p>
                  O que começou como um hobby transformou-se numa verdadeira arte. Hoje, partilhamos
                  o nosso trabalho com pessoas que valorizam o autêntico e o feito com amor.
                </p>
                <p>
                  Mais do que produtos, criamos memórias. Cada amigurumi, cada peça para o lar,
                  cada acessório carrega consigo horas de dedicação e um pedacinho do nosso coração.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/5704720/pexels-photo-5704720.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Trabalho em crochê"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-primary-600 text-white p-6 rounded-lg shadow-lg max-w-xs">
                <p className="text-sm font-medium">
                  "Cada ponto é uma expressão de amor e criatividade"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Valores */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Os Nossos Valores
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Princípios que guiam cada criação e cada ponto que damos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Valor 1 */}
            <div className="bg-white p-8 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Feito com Amor
              </h3>
              <p className="text-gray-600">
                Cada peça é criada com paixão e dedicação, tornando-a verdadeiramente única e especial.
              </p>
            </div>

            {/* Valor 2 */}
            <div className="bg-white p-8 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Qualidade Premium
              </h3>
              <p className="text-gray-600">
                Utilizamos apenas materiais selecionados e técnicas apuradas para garantir durabilidade.
              </p>
            </div>

            {/* Valor 3 */}
            <div className="bg-white p-8 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Criatividade
              </h3>
              <p className="text-gray-600">
                Cada design é pensado ao pormenor, combinando tradição com toques modernos e originais.
              </p>
            </div>

            {/* Valor 4 */}
            <div className="bg-white p-8 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Proximidade
              </h3>
              <p className="text-gray-600">
                Valorizamos cada cliente e mantemos um relacionamento próximo e personalizado.
              </p>
            </div>
          </div>
        </div>

        {/* O Que Fazemos */}
        <div className="mb-20">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  O Que Fazemos
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Amigurumis Personalizados</h3>
                      <p className="text-gray-600">
                        Criamos adoráveis bonecos de crochê, desde animais a personagens, perfeitos para
                        decoração ou presentes especiais.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Decoração para o Lar</h3>
                      <p className="text-gray-600">
                        Peças que transformam ambientes: mantas, almofadas, tapetes e muito mais,
                        sempre com um toque único.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Acessórios de Moda</h3>
                      <p className="text-gray-600">
                        Bolsas, carteiras, chapéus e outros acessórios que combinam estilo e funcionalidade
                        com o charme do trabalho.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Encomendas Personalizadas</h3>
                      <p className="text-gray-600">
                        Tem uma ideia especial? Trabalhamos consigo para criar a peça perfeita,
                        adaptada às suas necessidades e preferências.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-full min-h-[400px]">
                <img
                  src="https://images.pexels.com/photos/6045071/pexels-photo-6045071.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Produtos de crochê"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Vamos Criar Algo Especial Juntos?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Explore a nossa coleção ou entre em contacto para uma encomenda personalizada
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/loja"
              className="inline-block px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Ver Produtos
            </a>
            <a
              href="/contacto"
              className="inline-block px-8 py-4 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-400 transition-colors border-2 border-white"
            >
              Falar Connosco
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
