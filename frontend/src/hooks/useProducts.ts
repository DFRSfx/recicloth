import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { productsApi } from '../utils/apiHelpers';
import { adaptProductsToFrontend, BackendProduct } from '../utils/adapters';
import { useLanguage } from '../context/LanguageContext';

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useLanguage();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsApi.getAll(lang);

      if (response && Array.isArray(response)) {
        const adaptedProducts = adaptProductsToFrontend(response as BackendProduct[]);
        setProducts(adaptedProducts);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Erro ao carregar produtos. Por favor, tente novamente.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // re-fetch when language changes

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProduct(id: string): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lang } = useLanguage();

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const productId = parseInt(id);

      if (isNaN(productId)) {
        throw new Error('Invalid product ID');
      }

      const response = await productsApi.getOne(productId, lang);

      if (response) {
        const adaptedProducts = adaptProductsToFrontend([response as BackendProduct]);
        setProduct(adaptedProducts[0]);
      } else {
        throw new Error('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Erro ao carregar produto. Por favor, tente novamente.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id, lang]);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [fetchProduct, id]); // re-fetch when language or id changes

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}
