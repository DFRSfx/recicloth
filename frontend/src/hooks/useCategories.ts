import { useState, useEffect, useCallback } from 'react';
import { categoriesApi } from '../utils/apiHelpers';
import { adaptCategoriesToFrontend, BackendCategory, FrontendCategory } from '../utils/adapters';
import { useLanguage } from '../context/LanguageContext';

interface UseCategoriesResult {
  categories: FrontendCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<FrontendCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useLanguage();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesApi.getAll(lang);

      if (response && Array.isArray(response)) {
        const adaptedCategories = adaptCategoriesToFrontend(response as BackendCategory[]);
        setCategories(adaptedCategories);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Erro ao carregar categorias. Por favor, tente novamente.');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]); // re-fetch when language changes

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

