import React from 'react';
import { Instagram, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary-900 text-white"> {/* Usei bg-primary-900 para forçar um tom bem escuro como no print */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        
        {/* Alterado para grid-cols-3 no desktop para distribuir as 3 colunas uniformemente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          
          {/* Coluna 1: Brand & Social */}
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold mb-4 tracking-tight">Recicloth</h3>
            <p className="text-primary-100 text-[15px] leading-relaxed mb-6 max-w-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-3">
              <a
                href="https://www.instagram.com/recicloth.croche/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.instagramAria')}
                className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <Instagram className="h-[18px] w-[18px]" strokeWidth={2} />
              </a>
              <a
                href="mailto:recicloth1972@gmail.com"
                aria-label={t('footer.emailAria')}
                className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <Mail className="h-[18px] w-[18px]" strokeWidth={2} />
              </a>
            </div>
          </div>

          {/* Coluna 2: Links Úteis */}
          <div className="flex flex-col">
            <h4 className="text-lg font-bold mb-5 tracking-tight">{t('footer.links.title')}</h4>
            <ul className="space-y-3.5 text-primary-100 text-[15px]">
              <li>
                <Link to="/loja" className="hover:text-white transition-colors block">
                  {t('footer.links.allProducts')}
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-white transition-colors block">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link to="/politica-privacidade" className="hover:text-white transition-colors block">
                  {t('footer.links.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/politica-devolucao" className="hover:text-white transition-colors block">
                  {t('footer.links.returns')}
                </Link>
              </li>
              <li>
                <Link to="/termos-condicoes" className="hover:text-white transition-colors block">
                  {t('footer.links.terms')}
                </Link>
              </li>
              <li className="pt-2">
                <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity inline-block">
                  <img src="https://www.livroreclamacoes.pt/Inicio/img/LRE_Theme.Logo_White.png?05CfBRVXskp07svwn4m+4A" alt={t('footer.links.complaints')} className="h-8 w-auto" />
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contacto */}
          <div className="flex flex-col">
            <h4 className="text-lg font-bold mb-5 tracking-tight">{t('nav.contact')}</h4>
            <ul className="space-y-3.5 text-primary-100 text-[15px]">
              <li>
                <a href="tel:+351919626697" className="flex items-center hover:text-white transition-colors group">
                  <Phone className="h-[18px] w-[18px] mr-3 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span>{t('contact.info.phoneValue')}</span>
                </a>
              </li>
              <li>
                <a href="mailto:recicloth1972@gmail.com" className="flex items-center hover:text-white transition-colors group">
                  <Mail className="h-[18px] w-[18px] mr-3 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <span>recicloth1972@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-12 pt-8 text-center sm:text-left md:text-center text-primary-200 text-sm">
          <p>&copy; {new Date().getFullYear()} Recicloth. {t('footer.shipping')}</p>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;