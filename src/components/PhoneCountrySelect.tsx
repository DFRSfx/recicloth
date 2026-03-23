import React, { useState, useRef, useEffect } from 'react';
import { getCountryCallingCode } from 'react-phone-number-input';
import type { CountryCode } from 'libphonenumber-js';

interface Option {
  value?: CountryCode;
  label: string;
  divider?: boolean;
}

interface Props {
  value?: CountryCode;
  onChange: (value?: CountryCode) => void;
  options: Option[];
  iconComponent: React.ComponentType<{ country: CountryCode; label: string }>;
  disabled?: boolean;
  tabIndex?: number | string;
}

const PhoneCountrySelect: React.FC<Props> = ({
  value,
  onChange,
  options,
  iconComponent: FlagIcon,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = options.filter(
    (o) => !o.divider && o.value && (o.label ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const selectedOption = options.find((o) => o.value === value);
  const dialCode = value ? `+${getCountryCallingCode(value)}` : '+?';

  return (
    <div ref={containerRef} className="relative self-stretch">
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen((p) => !p); setSearch(''); }}
        className="flex items-center gap-2 px-3 h-full bg-gray-50 hover:bg-gray-100 border-r border-gray-200 transition-colors text-sm text-gray-700 font-medium whitespace-nowrap rounded-l-lg"
      >
        {value && (
          <span className="w-6 h-4 rounded-sm overflow-hidden flex items-center shrink-0">
            <FlagIcon country={value} label={selectedOption?.label ?? ''} />
          </span>
        )}
        <span>{dialCode}</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-[500] mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar país..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-primary-500"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => { onChange(option.value); setOpen(false); setSearch(''); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${option.value === value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}`}
                  >
                    <span className="w-6 h-4 rounded-sm overflow-hidden flex items-center shrink-0">
                      <FlagIcon country={option.value!} label={option.label} />
                    </span>
                    <span className="flex-1 text-left">{option.label}</span>
                    <span className="text-gray-400 text-xs">
                      +{getCountryCallingCode(option.value!)}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-4 text-center text-sm text-gray-400">
                Nenhum país encontrado
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PhoneCountrySelect;
