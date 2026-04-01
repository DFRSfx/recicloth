import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const LANGS = [
  { code: 'pt', label: 'Português', flag: '/images/flags/pt.svg' },
  { code: 'en', label: 'English',   flag: '/images/flags/en.svg' },
] as const;

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find(l => l.code === lang) ?? LANGS[0];

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 150);
  };

  const handleSelect = (code: 'pt' | 'en') => {
    setLang(code);
    handleClose();
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handleClose();
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={() => open ? handleClose() : setOpen(true)}
        aria-label="Mudar idioma"
        title={current.label}
        className="flex items-center gap-1.5 rounded-full hover:opacity-80 transition-opacity focus:outline-none group"
      >
        <img
          src={current.flag}
          alt={current.label}
          className="w-6 h-4 object-cover shadow-sm transition-all"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute right-0 top-full mt-3 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[140px]
            ${closing ? 'animate-[fadeOut_0.15s_ease_forwards]' : 'animate-[fadeIn_0.15s_ease_forwards]'}`}
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => handleSelect(l.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                ${lang === l.code
                  ? 'bg-[#f0faf4] text-[#1E4D3B] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <img
                src={l.flag}
                alt={l.label}
                className="w-5 h-3.5 object-cover shadow-sm"
              />
              {l.label}
              {lang === l.code && (
                <svg className="ml-auto h-3.5 w-3.5 text-[#1E4D3B]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
