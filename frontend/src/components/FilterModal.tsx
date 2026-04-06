import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (value: string) => void;
  categories?: string[];
  selectedColor?: string;
  onColorChange?: (value: string) => void;
  colors?: { name: string; hex: string }[];
  priceRange?: [number, number];
  onPriceRangeChange?: (range: [number, number]) => void;
  onClearFilters?: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  sortBy = 'newest',
  onSortChange = () => undefined,
  selectedCategory = '',
  onCategoryChange = () => undefined,
  categories = [],
  selectedColor = '',
  onColorChange = () => undefined,
  colors = [] as { name: string; hex: string }[],
  priceRange = [0, 100],
  onPriceRangeChange = () => undefined,
  onClearFilters = () => undefined,
}) => {
  const { t } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      setTimeout(() => {
        document.body.style.overflow = 'unset';
      }, 300);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const sortOptions = [
    { value: 'name', label: t('filter.sort.alphaAZ') },
    { value: 'name_desc', label: t('filter.sort.alphaZA') },
    { value: 'price_asc', label: t('filter.sort.priceAsc') },
    { value: 'price_desc', label: t('filter.sort.priceDesc') },
    { value: 'newest', label: t('filter.sort.newest') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden pointer-events-none">
      
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 pointer-events-auto ${
          isAnimating ? 'opacity-40' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Bottom Sheet Modal */}
      <div
        className={`relative w-full h-[90vh] bg-white rounded-t-2xl flex flex-col transform transition-transform duration-300 ease-out pointer-events-auto ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header - Fixed */}
        <div className="flex justify-end p-4 pb-2">
          <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:text-black transition-colors">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10 hide-scrollbar">
          
          {/* SORT BY */}
          <section>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-5">{t('common.sort')}</h3>
            <div className="space-y-4">
              {sortOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                    <input
                      type="radio"
                      name="sortBy"
                      value={option.value}
                      checked={sortBy === option.value}
                      onChange={(e) => onSortChange(e.target.value)}
                      className="peer sr-only"
                    />
                    {/* Outer Circle */}
                    <div className="w-5 h-5 rounded-full border border-gray-300 peer-checked:border-black transition-colors" />
                    {/* Inner Dot */}
                    <div className="absolute w-3 h-3 rounded-full bg-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[15px] text-[#333333] group-hover:text-black leading-none pt-0.5 transition-colors">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* COLOR */}
          <section>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-5">{t('common.color')}</h3>
            <div className="space-y-4">
              {colors.map((color) => (
                <label key={color.hex} className="flex items-center gap-4 cursor-pointer group">
                  {/* CUSTOM CHECKBOX */}
                  <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedColor === color.hex}
                      onChange={(e) => onColorChange(e.target.checked ? color.hex : '')}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded-[4px] border border-gray-300 peer-checked:border-[#1E4D3B] peer-checked:bg-[#1E4D3B] transition-all flex items-center justify-center">
                      <Check size={14} strokeWidth={3} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className="w-5 h-5 rounded-full border border-gray-200 shadow-sm"
                      style={{ backgroundColor: color.hex || '#E5E7EB' }}
                    />
                    <span className="text-[15px] text-[#333333] group-hover:text-black leading-none pt-0.5 transition-colors">
                      {color.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* CATEGORY */}
          <section>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-5">{t('filter.category')}</h3>
            <div className="space-y-4">
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-4 cursor-pointer group">
                  {/* CUSTOM CHECKBOX */}
                  <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedCategory === category}
                      onChange={(e) => onCategoryChange(e.target.checked ? category : '')}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded-[4px] border border-gray-300 peer-checked:border-[#1E4D3B] peer-checked:bg-[#1E4D3B] transition-all flex items-center justify-center">
                      <Check size={14} strokeWidth={3} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <span className="text-[15px] text-[#333333] group-hover:text-black leading-none pt-0.5 transition-colors">
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* PRICE SLIDER */}
          <section>
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-8">{t('filter.priceRange')}</h3>
            <div className="px-3 pb-4">
              
              <div className="relative h-[4px] bg-gray-200 rounded-full mb-6 mx-1">
                {/* Active Track */}
                <div
                  className="absolute h-[4px] bg-black rounded-full z-10"
                  style={{
                    left: `${priceRange[0]}%`,
                    width: `${priceRange[1] - priceRange[0]}%`,
                  }}
                />

                {/* Min Thumb */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value <= priceRange[1] - 5) onPriceRangeChange([value, priceRange[1]]);
                  }}
                  className="absolute w-full h-[4px] bg-transparent appearance-none pointer-events-none z-20 custom-slider -mx-1"
                />

                {/* Max Thumb */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= priceRange[0] + 5) onPriceRangeChange([priceRange[0], value]);
                  }}
                  className="absolute w-full h-[4px] bg-transparent appearance-none pointer-events-none z-20 custom-slider -mx-1"
                />
              </div>

              {/* Price Labels */}
              <div className="flex justify-between items-center text-[15px] font-medium text-[#333333]">
                <span>{priceRange[0]} €</span>
                <span>{priceRange[1]} €</span>
              </div>
            </div>

            <style>{`
              .custom-slider::-webkit-slider-thumb {
                pointer-events: auto;
                width: 24px;
                height: 24px;
                background: #E5E7EB;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                cursor: pointer;
                -webkit-appearance: none;
                appearance: none;
                margin-top: -10px; /* Centers thumb strictly on the 4px track */
              }
              .custom-slider::-moz-range-thumb {
                pointer-events: auto;
                width: 24px;
                height: 24px;
                background: #E5E7EB;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                cursor: pointer;
              }
            `}</style>
          </section>

        </div>

        {/* Footer Actions - Fixed at Bottom */}
        <div className="relative w-full p-4 bg-white border-t border-gray-100 flex gap-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-30 mt-auto">
          <button
            onClick={() => {
              onClearFilters();
              onClose();
            }}
            className="flex-1 py-3.5 bg-white text-[#1E4D3B] border border-[#1E4D3B] font-medium text-[15px] rounded hover:bg-gray-50 transition-colors"
          >
            {t('filter.clear')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-[#1E4D3B] text-white font-medium text-[15px] rounded hover:bg-[#163a2c] transition-colors"
          >
            {t('filter.apply')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FilterModal;