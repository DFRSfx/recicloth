import React from 'react';
import { Instagram, Mail, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-semibold mb-4">Arte em Ponto</h3>
            <p className="text-primary-200 mb-6 max-w-md">
              Criações únicas em crochê feitas com amor e dedicação.
              Cada peça é especial e pensada para trazer conforto e beleza ao seu lar.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/arteemponto.croche/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da Arte em Ponto"
                className="p-2 bg-primary-700 rounded-full hover:bg-primary-600 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:arteemponto1972@gmail.com"
                aria-label="Enviar email para Arte em Ponto"
                className="p-2 bg-primary-700 rounded-full hover:bg-primary-600 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links Úteis */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-primary-200">
              <li>
                <a href="/loja" className="hover:text-white transition-colors">
                  Todos os Produtos
                </a>
              </li>
              {/* <li>
                <a href="/sobre" className="hover:text-white transition-colors">
                  Sobre Nós
                </a>
              </li> */}
              <li>
                <a href="/contacto" className="hover:text-white transition-colors">
                  Contacto
                </a>
              </li>
              <li>
                <a href="/politica-privacidade" className="hover:text-white transition-colors">
                  Política de Privacidade
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-primary-200">
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>+351 919 626 697</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span>arteemponto1972@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-700 mt-8 pt-8 text-center text-primary-200">
          <p>&copy; {new Date().getFullYear()} Arte em Ponto. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;