import { useState, useRef, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';

interface ColorOption {
  name: string;
  hex: string;
}

// Lista de cores predefinidas comuns em crochê
const PRESET_COLORS: ColorOption[] = [
  // Cores Básicas
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Preto', hex: '#000000' },
  { name: 'Cinza', hex: '#808080' },
  { name: 'Cinza Claro', hex: '#D3D3D3' },

  // Vermelhos e Rosas
  { name: 'Vermelho', hex: '#FF0000' },
  { name: 'Vermelho Escuro', hex: '#8B0000' },
  { name: 'Rosa', hex: '#FFC0CB' },
  { name: 'Rosa Claro', hex: '#FFB6C1' },
  { name: 'Rosa Escuro', hex: '#C71585' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Salmão', hex: '#FA8072' },

  // Laranjas
  { name: 'Laranja', hex: '#FFA500' },
  { name: 'Laranja Escuro', hex: '#FF8C00' },
  { name: 'Pêssego', hex: '#FFDAB9' },

  // Amarelos
  { name: 'Amarelo', hex: '#FFFF00' },
  { name: 'Amarelo Claro', hex: '#FFFFE0' },
  { name: 'Dourado', hex: '#FFD700' },
  { name: 'Mostarda', hex: '#FFDB58' },

  // Verdes
  { name: 'Verde', hex: '#008000' },
  { name: 'Verde Claro', hex: '#90EE90' },
  { name: 'Verde Escuro', hex: '#006400' },
  { name: 'Verde Menta', hex: '#98FF98' },
  { name: 'Verde Água', hex: '#7FFFD4' },
  { name: 'Verde Musgo', hex: '#8A9A5B' },

  // Azuis
  { name: 'Azul', hex: '#0000FF' },
  { name: 'Azul Claro', hex: '#ADD8E6' },
  { name: 'Azul Escuro', hex: '#00008B' },
  { name: 'Azul Marinho', hex: '#000080' },
  { name: 'Azul Turquesa', hex: '#40E0D0' },
  { name: 'Azul Céu', hex: '#87CEEB' },

  // Roxos e Lilases
  { name: 'Roxo', hex: '#800080' },
  { name: 'Roxo Claro', hex: '#DDA0DD' },
  { name: 'Lilás', hex: '#C8A2C8' },
  { name: 'Lavanda', hex: '#E6E6FA' },
  { name: 'Púrpura', hex: '#9370DB' },

  // Castanhos e Bege
  { name: 'Castanho', hex: '#A52A2A' },
  { name: 'Castanho Claro', hex: '#D2691E' },
  { name: 'Bege', hex: '#F5F5DC' },
  { name: 'Creme', hex: '#FFFDD0' },
  { name: 'Caramelo', hex: '#C68E17' },

  // Outras
  { name: 'Bordô', hex: '#800020' },
  { name: 'Vinho', hex: '#722F37' },
  { name: 'Nude', hex: '#E3BC9A' },
  { name: 'Ciano', hex: '#00FFFF' },
  { name: 'Magenta', hex: '#FF00FF' },
];

interface ColorPickerProps {
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
}

export default function ColorPicker({ selectedColors, onColorsChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredColors, setFilteredColors] = useState<ColorOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter colors based on input
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = PRESET_COLORS.filter(color =>
        color.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedColors.includes(color.name)
      );
      setFilteredColors(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredColors([]);
      setShowSuggestions(false);
    }
  }, [inputValue, selectedColors]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addColor = (colorName: string) => {
    if (colorName.trim() && !selectedColors.includes(colorName.trim())) {
      onColorsChange([...selectedColors, colorName.trim()]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeColor = (colorToRemove: string) => {
    onColorsChange(selectedColors.filter(c => c !== colorToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredColors.length > 0) {
        addColor(filteredColors[0].name);
      } else if (inputValue.trim()) {
        addColor(inputValue);
      }
    }
  };

  const getColorHex = (colorName: string): string | undefined => {
    return PRESET_COLORS.find(c => c.name === colorName)?.hex;
  };

  return (
    <div className="space-y-3">
      {/* Input with suggestions */}
      <div className="relative">
        <div className="flex gap-2 items-stretch">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(filteredColors.length > 0)}
            placeholder="Digite a cor (ex: Azul, Vermelho, Rosa...)"
            className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <button
            type="button"
            onClick={() => inputValue.trim() && addColor(inputValue)}
            className="px-3 sm:px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center gap-1 sm:gap-2 touch-manipulation min-h-[44px] flex-shrink-0 whitespace-nowrap"
            aria-label="Adicionar cor"
          >
            <Plus size={18} />
            <span className="hidden xs:inline sm:inline">Adicionar</span>
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredColors.map((color, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addColor(color.name)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 transition-colors touch-manipulation min-h-[44px]"
              >
                <div
                  className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-gray-900">{color.name}</span>
                <span className="text-gray-400 text-xs ml-auto">{color.hex}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected colors */}
      {selectedColors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedColors.map((color, index) => {
            const hex = getColorHex(color);
            return (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm border border-primary-200"
              >
                {hex && (
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: hex }}
                  />
                )}
                <span>{color}</span>
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  className="hover:text-primary-900 active:text-primary-950 transition-colors p-1 touch-manipulation min-h-[24px] min-w-[24px] flex items-center justify-center"
                  aria-label={`Remover cor ${color}`}
                >
                  <X size={14} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Popular colors quick select */}
      <div className="pt-2">
        <p className="text-xs text-gray-500 mb-2">Cores Populares:</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.slice(0, 12).map((color, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addColor(color.name)}
              disabled={selectedColors.includes(color.name)}
              className={`group relative p-2 rounded-lg border-2 transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center ${
                selectedColors.includes(color.name)
                  ? 'border-green-500 opacity-50 cursor-not-allowed'
                  : 'border-gray-300 hover:border-primary-500 active:border-primary-600 active:scale-95'
              }`}
              title={color.name}
              aria-label={`Selecionar cor ${color.name}`}
            >
              <div
                className="w-8 h-8 rounded"
                style={{ backgroundColor: color.hex }}
              />
              {selectedColors.includes(color.name) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                  <Check size={16} className="text-white" />
                </div>
              )}
              {/* Tooltip - visible on mobile tap, hover on desktop */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
