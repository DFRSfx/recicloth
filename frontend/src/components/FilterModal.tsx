import React from 'react';
import { X } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  selectedColor: string;
  onColorChange: (value: string) => void;
  colors: string[];
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  sortBy,
  onSortChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedColor,
  onColorChange,
  colors,
  priceRange,
  onPriceRangeChange,
  onClearFilters,
}) => {
  const [isClosing, setIsClosing] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setIsAnimating(false);
    }, 300);
  };

  if (!isOpen) return null;

  const getColorCode = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'Bege': '#F5F5DC',
      'Castanho': '#8B4513',
      'Branco': '#FFFFFF',
      'Cru': '#F5E6D3',
      'Verde': '#22C55E',
      'Azul': '#3B82F6',
      'Vermelho': '#EF4444',
      'Rosa': '#EC4899',
      'Amarelo': '#F59E0B',
      'Preto': '#000000',
      'Cinzento': '#6B7280',
      'Bordô': '#7F1D1D',
    };
    return colorMap[colorName] || '#D1D5DB';
  };

  const sortOptions = [
    { value: 'name', label: 'Alfabética A-Z' },
    { value: 'name_desc', label: 'Alfabética Z-A' },
    { value: 'price_asc', label: 'Preço Asc.' },
    { value: 'price_desc', label: 'Preço Desc.' },
    { value: 'newest', label: 'Os mais recentes' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[600px] lg:w-[700px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isClosing ? 'translate-x-full' : isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-end">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* Sort By */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Ordenar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortOptions.map((option) => (
                <label
                  key={option.value}
                  className="relative flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded transition-colors"
                >
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={sortBy === option.value}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="sr-only"
                  />
                  <span
                    className="w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-all"
                    style={{
                      borderColor: sortBy === option.value ? '#333' : '#e0e0e0',
                      borderWidth: '1px',
                    }}
                  >
                    {sortBy === option.value && (
                      <span className="w-3 h-3 rounded-full bg-gray-900"></span>
                    )}
                  </span>
                  <span className="text-base text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Cor</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {colors.map((color) => (
                <label
                  key={color}
                  className="relative flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedColor === color}
                    onChange={(e) => onColorChange(e.target.checked ? color : '')}
                    className="sr-only"
                  />
                  <span
                    className="w-5 h-5 flex-shrink-0 flex items-center justify-center transition-all rounded-sm"
                    style={{
                      borderColor: selectedColor === color ? '#333' : '#e0e0e0',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  >
                    {selectedColor === color && (
                      <svg className="w-3 h-3 text-gray-900" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-5 h-5 rounded-full border flex-shrink-0"
                      style={{
                        backgroundColor: getColorCode(color),
                        borderColor: color === 'Branco' ? '#d1d5db' : getColorCode(color),
                        borderWidth: color === 'Branco' ? '2px' : '1px',
                      }}
                    />
                    <span className="text-base text-gray-700 truncate">{color}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Categoria</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label
                  key={category}
                  className="relative flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategory === category}
                    onChange={(e) => onCategoryChange(e.target.checked ? category : '')}
                    className="sr-only"
                  />
                  <span
                    className="w-5 h-5 flex-shrink-0 flex items-center justify-center transition-all rounded-sm"
                    style={{
                      borderColor: selectedCategory === category ? '#333' : '#e0e0e0',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                  >
                    {selectedCategory === category && (
                      <svg className="w-3 h-3 text-gray-900" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </span>
                  <span className="text-base text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Preço</h3>
            <div className="px-3">
              {/* Dual Range Slider Container */}
              <div className="relative h-[2px] bg-[#DAD9D6] rounded-full mt-9 mb-12">
                {/* Active Range Bar */}
                <div
                  className="absolute h-[2px] bg-[#333333] rounded-full z-[1]"
                  style={{
                    left: `${priceRange[0]}%`,
                    width: `${priceRange[1] - priceRange[0]}%`,
                  }}
                />

                {/* Min Range Input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value < priceRange[1]) {
                      onPriceRangeChange([value, priceRange[1]]);
                    }
                  }}
                  className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none z-[2]"
                  style={{
                    background: 'transparent',
                  }}
                />

                {/* Max Range Input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value > priceRange[0]) {
                      onPriceRangeChange([priceRange[0], value]);
                    }
                  }}
                  className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none z-[2]"
                  style={{
                    background: 'transparent',
                  }}
                />
              </div>

              {/* Price Labels */}
              <div className="flex justify-between items-center">
                <div className="text-gray-700">
                  <span className="font-medium text-base">{priceRange[0]}</span>
                  <span className="ml-0.5 text-base">€</span>
                </div>
                <div className="text-gray-700">
                  <span className="font-medium text-base">{priceRange[1]}</span>
                  <span className="ml-0.5 text-base">€</span>
                </div>
              </div>
            </div>

            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                pointer-events: all;
                width: 24px;
                height: 24px;
                background: #DAD9D6;
                border-radius: 50%;
                cursor: pointer;
                appearance: none;
                -webkit-appearance: none;
              }

              input[type="range"]::-moz-range-thumb {
                pointer-events: all;
                width: 24px;
                height: 24px;
                background: #DAD9D6;
                border-radius: 50%;
                cursor: pointer;
                border: none;
              }

              input[type="range"]::-ms-thumb {
                pointer-events: all;
                width: 24px;
                height: 24px;
                background: #DAD9D6;
                border-radius: 50%;
                cursor: pointer;
              }
            `}</style>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={() => {
                onClearFilters();
                handleClose();
              }}
              className="flex-1 py-3 text-primary-600 hover:text-white border border-primary-600 hover:bg-primary-600 rounded-md transition-colors font-medium text-base"
            >
              Limpar Filtros
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium text-base"
            >
              Ver produtos
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterModal;
