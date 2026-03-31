import React, { useState, useEffect } from 'react';
import { productsApi } from '../../utils/apiHelpers';
import { X, Save, Globe } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface TranslationsModalProps {
  productId: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface TranslationData {
  name: string;
  description: string;
  colors: { hex: string; name: string }[];
}

type TranslationsState = Record<string, TranslationData>;

export default function TranslationsModal({ productId, onClose, onSuccess }: TranslationsModalProps) {
  const [translations, setTranslations] = useState<TranslationsState>({});
  const [activeLang, setActiveLang] = useState<'pt' | 'en'>('pt');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setLoading(true);
        const data = await productsApi.getTranslations(productId);
        
        // Ensure both languages exist in state even if API doesn't return them
        setTranslations({
          pt: data.pt || { name: '', description: '', colors: [] },
          en: data.en || { name: '', description: '', colors: [] }
        });
      } catch (err) {
        console.error('Failed to fetch translations', err);
        setError('Erro ao carregar traduções originais.');
      } finally {
        setLoading(false);
      }
    };

    fetchTranslations();
  }, [productId]);

  const handleChange = (field: keyof TranslationData, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [activeLang]: {
        ...prev[activeLang],
        [field]: value,
      },
    }));
  };

  const handleColorChange = (hex: string, newName: string) => {
    setTranslations((prev) => {
      const current = prev[activeLang];
      const updatedColors = current.colors.map((c) =>
        c.hex === hex ? { ...c, name: newName } : c
      );
      
      // If color wasn't in this language yet for some reason, we can't easily add it here
      // without knowing the original english name, but it should exist from the fetch.

      return {
        ...prev,
        [activeLang]: {
          ...current,
          colors: updatedColors,
        },
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await productsApi.updateTranslations(productId, translations);
      onSuccess();
    } catch (err) {
      console.error('Failed to save translations', err);
      setError('Erro ao guardar traduções. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">A carregar traduções...</span>
        </div>
      </div>
    );
  }

  const currentData = translations[activeLang];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Gerir Traduções</h2>
              <p className="text-sm text-gray-500">Edite os textos do produto em diferentes idiomas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 gap-6 flex-shrink-0">
          <button
            onClick={() => setActiveLang('pt')}
            className={`py-4 font-medium text-sm transition-colors border-b-2 ${
              activeLang === 'pt'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Português (PT)
          </button>
          <button
            onClick={() => setActiveLang('en')}
            className={`py-4 font-medium text-sm transition-colors border-b-2 ${
              activeLang === 'en'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Inglês (EN)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Produto <span className="uppercase text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">{activeLang}</span>
            </label>
            <input
              type="text"
              value={currentData?.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div key={activeLang}>
            <RichTextEditor
              label={`Descrição (${activeLang.toUpperCase()})`}
              value={currentData?.description || ''}
              onChange={(html) => handleChange('description', html)}
              placeholder={`Descrição no idioma ${activeLang.toUpperCase()}...`}
            />
          </div>

          {currentData?.colors?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cores <span className="uppercase text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">{activeLang}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentData.colors.map((color) => (
                  <div key={color.hex} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <input
                      type="text"
                      value={color.name}
                      onChange={(e) => handleColorChange(color.hex, e.target.value)}
                      placeholder="Nome da cor"
                      className="flex-1 px-3 py-1.5 text-sm border border-transparent hover:border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded bg-gray-50 focus:bg-white transition-all outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium border border-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
            ) : (
              <Save size={18} />
            )}
            Guardar Traduções
          </button>
        </div>
      </div>
    </div>
  );
}
