import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import pt from '../locales/pt.json';
import en from '../locales/en.json';

type Lang = 'pt' | 'en';

const translations: Record<Lang, Record<string, string>> = { pt, en } as any;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('recicloth_lang');
    return (stored === 'en' ? 'en' : 'pt') as Lang;
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('recicloth_lang', newLang);
  };

  const t = useCallback(
    (key: string): string =>
      translations[lang][key] ?? translations['pt'][key] ?? key,
    [lang]
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
