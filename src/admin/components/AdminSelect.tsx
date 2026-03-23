import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface AdminSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  wrapperClassName?: string;
}

export default function AdminSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  disabled = false,
  wrapperClassName = '',
}: AdminSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-grid ${wrapperClassName}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 pl-3 pr-2.5 py-2 bg-white border border-gray-200 rounded-lg text-sm shadow-sm hover:border-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          className={`shrink-0 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-60 overflow-auto">
          {options.map(option => {
            const isSelected = String(option.value) === String(value);
            return (
              <li
                key={option.value}
                onClick={() => { onChange(String(option.value)); setOpen(false); }}
                className={`flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer select-none transition-colors ${
                  isSelected
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
                {isSelected && <Check size={14} strokeWidth={2.5} className="shrink-0 text-amber-600" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
