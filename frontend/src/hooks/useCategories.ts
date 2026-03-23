import { useState, useEffect } from 'react';
import { categoriesApi } from '../utils/apiHelpers';
import { adaptCategoriesToFrontend, BackendCategory, FrontendCategory } from '../utils/adapters';

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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoriesApi.getAll();

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
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}
