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
              Moda que respeita o planeta — roupa reciclada, upcycled e de segunda mão selecionada com critério
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
                  A <span className="font-semibold text-primary-600">Recicloth</span> nasceu da convicção de que
                  a moda pode ser bonita <em>e</em> responsável. Cada peça que vendemos — reciclada, upcycled
                  ou de segunda mão — é uma alternativa concreta ao consumo descartável.
                </p>
                <p>
                  A indústria têxtil é uma das mais poluentes do mundo. Ao escolher roupa em segunda
                  circuito, cada cliente da Recicloth contribui diretamente para reduzir o desperdício
                  de água, energia e matérias-primas associado à produção de peças novas.
                </p>
                <p>
                  O que começou como um projeto pessoal transformou-se numa loja dedicada a curar
                  os melhores artigos de moda sustentável — selecionados, verificados e apresentados
                  para quem valoriza o estilo sem comprometer o planeta.
                </p>
                <p>
                  Mais do que vender roupa, queremos mudar hábitos. Cada compra na Recicloth é um voto
                  por um sistema de moda mais justo, circular e consciente.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Roupa reciclada selecionada pela Recicloth"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-primary-600 text-white p-6 rounded-lg shadow-lg max-w-xs">
                <p className="text-sm font-medium">
                  "Cada peça escolhida é uma peça de roupa que não vai para o lixo"
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
              Princípios que guiam cada escolha e cada peça que disponibilizamos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Valor 1 */}
            <div className="bg-white p-8 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Sustentabilidade
              </h3>
              <p className="text-gray-600">
                Cada peça que vendemos é uma alternativa ao consumo novo, reduzindo o impacto ambiental da moda.
              </p>
            </div>

            {/* Valor 2 */}
            <div className="bg-white p-8 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Seleção Rigorosa
              </h3>
              <p className="text-gray-600">
                Cada artigo é inspecionado individualmente para garantir qualidade, estado e autenticidade.
              </p>
            </div>

            {/* Valor 3 */}
            <div className="bg-white p-8 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Moda Circular
              </h3>
              <p className="text-gray-600">
                Acreditamos numa moda sem fim de linha — onde cada peça tem sempre mais uma vida para dar.
              </p>
            </div>

            {/* Valor 4 */}
            <div className="bg-white p-8 rounded-lg shadow-sm text-center hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Transparência
              </h3>
              <p className="text-gray-600">
                Descrevemos o estado real de cada peça com honestidade, para que saiba exatamente o que recebe.
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
                      <h3 className="font-semibold text-gray-900 mb-1">Roupa Reciclada</h3>
                      <p className="text-gray-600">
                        Peças de vestuário para homem e mulher selecionadas de fontes sustentáveis,
                        limpas e prontas a usar.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Peças Upcycled</h3>
                      <p className="text-gray-600">
                        Artigos transformados e melhorados a partir de materiais reutilizados,
                        com design contemporâneo e original.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Acessórios Sustentáveis</h3>
                      <p className="text-gray-600">
                        Malas, cintos, chapéus e outros acessórios de segunda mão que complementam
                        qualquer look de forma consciente.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Segunda Mão com Garantia</h3>
                      <p className="text-gray-600">
                        Todos os artigos passam por verificação de estado, higienização e descrição
                        honesta antes de chegarem até si.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-full min-h-[400px]">
                <img
                  src="https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Roupa sustentável Recicloth"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Vista-se de Forma Consciente
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Explore a nossa coleção de roupa sustentável ou fale connosco para qualquer dúvida
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
