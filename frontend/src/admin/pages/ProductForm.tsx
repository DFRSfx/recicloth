import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsApi } from '../../utils/apiHelpers';
import { useCategories } from '../../hooks/useCategories';
import { Save, ArrowLeft, X, Upload, GripVertical } from 'lucide-react';
import ColorPicker, { ColorOption } from '../components/ColorPicker';
import AdminSelect from '../components/AdminSelect';

interface SizeStockItem {
  size: string;
  stock: number;
}

type StockMode = 'unit' | 'apparel' | 'shoes';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  weight?: number;
  category_id: number;
  stock: number;
  stock_mode: StockMode;
  featured: boolean;
  colors?: ColorOption[];
  size_stock?: SizeStockItem[];
}

const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { categories } = useCategories();

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    weight: undefined,
    category_id: 0,
    stock: 0,
    stock_mode: 'unit',
    featured: false,
    colors: [],
    size_stock: []
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageColors, setImageColors] = useState<ColorOption[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchedElement = useRef<HTMLDivElement | null>(null);
  const [touchDragPosition, setTouchDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [mouseDragPosition, setMouseDragPosition] = useState<{ x: number; y: number } | null>(null);
  const dragTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  useEffect(() => {
    // Keep one color mapping per newly uploaded file
    setImageColors((prev) => {
      const next = [...prev];
      if (next.length < selectedFiles.length) {
        for (let i = next.length; i < selectedFiles.length; i++) next.push({ name: '', hex: '' });
      }
      if (next.length > selectedFiles.length) {
        return next.slice(0, selectedFiles.length);
      }
      return next;
    });
  }, [selectedFiles.length]);

  useEffect(() => {
    // If a color is removed from available colors, clear invalid image-color mappings
    setImageColors((prev) =>
      prev.map((color) => {
        if (!color?.name) return color;
        const exists = (formData.colors || []).some((available) => available.name === color.name);
        return exists ? color : { name: '', hex: '' };
      })
    );
  }, [formData.colors]);



  const loadProduct = async () => {
    try {
      const data = await productsApi.getOne(Number(id));
      if (data) {
        const parsedSizeStock: SizeStockItem[] = data.size_stock
          ? (Array.isArray(data.size_stock) ? data.size_stock : JSON.parse(data.size_stock))
              .map((item: any) => ({
                size: String(item?.size || '').toUpperCase(),
                stock: Math.max(0, parseInt(String(item?.stock ?? 0), 10) || 0)
              }))
              .filter((item: SizeStockItem) => item.size)
          : [];

        setFormData({
          name: data.name,
          description: data.description,
          price: data.price,
          weight: data.weight,
          category_id: Number(data.category_id),
          stock: Number(data.stock) || 0,
          stock_mode: (data.stock_mode === 'apparel' || data.stock_mode === 'shoes' || data.stock_mode === 'unit')
            ? data.stock_mode
            : (parsedSizeStock.length > 0 ? 'apparel' : 'unit'),
          featured: data.featured || false,
          colors: data.colors
            ? (Array.isArray(data.colors)
                ? data.colors
                : JSON.parse(data.colors))
                .map((item: any) =>
                  typeof item === 'string' ? { name: item, hex: '' } : { name: item.name || '', hex: item.hex || '' }
                )
            : [],
          size_stock: parsedSizeStock
        });
        
        // Load existing images from API - they come as file paths
        if (data.images && Array.isArray(data.images)) {
          setExistingImages(data.images);
          setImagePreviews(data.images);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      setError('Falha ao carregar produto');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    if (files.length > 0) clearFieldError('images');

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    // If it's an existing image
    if (index < existingImages.length) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // It's a new file
      const fileIndex = index - existingImages.length;
      setSelectedFiles(prev => prev.filter((_, i) => i !== fileIndex));
      setImageColors(prev => prev.filter((_, i) => i !== fileIndex));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    // Move in previews
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      const [movedItem] = newPreviews.splice(fromIndex, 1);
      newPreviews.splice(toIndex, 0, movedItem);
      return newPreviews;
    });

    // Move in existing images or files
    if (fromIndex < existingImages.length && toIndex < existingImages.length) {
      // Both are existing images
      setExistingImages(prev => {
        const newImages = [...prev];
        const [movedItem] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedItem);
        return newImages;
      });
    } else if (fromIndex >= existingImages.length && toIndex >= existingImages.length) {
      // Both are new files
      setSelectedFiles(prev => {
        const newFiles = [...prev];
        const fromFileIndex = fromIndex - existingImages.length;
        const toFileIndex = toIndex - existingImages.length;
        const [movedItem] = newFiles.splice(fromFileIndex, 1);
        newFiles.splice(toFileIndex, 0, movedItem);
        return newFiles;
      });
      setImageColors(prev => {
        const newColors = [...prev];
        const fromFileIndex = fromIndex - existingImages.length;
        const toFileIndex = toIndex - existingImages.length;
        const [movedColor] = newColors.splice(fromFileIndex, 1);
        newColors.splice(toFileIndex, 0, movedColor);
        return newColors;
      });
    } else {
      // Mixed - need to reorganize both arrays
      type AllItem =
        | { type: 'existing'; path: string; preview: string }
        | { type: 'new'; file: File; preview: string; color: ColorOption };

      const allItems: AllItem[] = [
        ...existingImages.map((path, i) => ({ type: 'existing' as const, path, preview: imagePreviews[i] })),
        ...selectedFiles.map((file, i) => ({
          type: 'new' as const,
          file,
          preview: imagePreviews[existingImages.length + i],
          color: imageColors[i] || { name: '', hex: '' }
        }))
      ];

      const [movedItem] = allItems.splice(fromIndex, 1);
      allItems.splice(toIndex, 0, movedItem);

      const newExisting = allItems
        .filter((item): item is { type: 'existing'; path: string; preview: string } => item.type === 'existing')
        .map(item => item.path);
      const newFiles = allItems
        .filter((item): item is { type: 'new'; file: File; preview: string; color: ColorOption } => item.type === 'new')
        .map(item => item.file);
      const newImageColors = allItems
        .filter((item): item is { type: 'new'; file: File; preview: string; color: ColorOption } => item.type === 'new')
        .map(item => item.color);
      const newPreviews = allItems.map(item => item.preview);

      setExistingImages(newExisting);
      setSelectedFiles(newFiles);
      setImageColors(newImageColors);
      setImagePreviews(newPreviews);
    }
  };

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleToggleSize = (size: string) => {
    const current = formData.size_stock || [];
    const exists = current.some((item) => item.size === size);
    const nextSizeStock = exists
      ? current.filter((item) => item.size !== size)
      : [...current, { size, stock: 0 }];

    setFormData((prev) => ({
      ...prev,
      size_stock: nextSizeStock,
      stock: nextSizeStock.reduce((sum, item) => sum + (Number(item.stock) || 0), 0),
    }));
    clearFieldError('size_stock');
  };

  const handleStockModeChange = (mode: StockMode) => {
    if (mode === 'unit') {
      setFormData((prev) => ({
        ...prev,
        stock_mode: mode,
        size_stock: [],
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      stock_mode: mode,
      size_stock: prev.size_stock || [],
      stock: (prev.size_stock || []).reduce((sum, item) => sum + (Number(item.stock) || 0), 0),
    }));
  };

  const handleSizeStockChange = (size: string, value: string) => {
    const stockValue = Math.max(0, parseInt(value || '0', 10) || 0);
    const nextSizeStock = (formData.size_stock || []).map((item) =>
      item.size === size ? { ...item, stock: stockValue } : item
    );

    setFormData((prev) => ({
      ...prev,
      size_stock: nextSizeStock,
      stock: nextSizeStock.reduce((sum, item) => sum + (Number(item.stock) || 0), 0),
    }));
  };

  const handleAddCustomSize = () => {
    const normalized = customSizeInput.trim().toUpperCase();
    if (!normalized) return;

    const exists = (formData.size_stock || []).some((item) => item.size === normalized);
    if (exists) {
      setCustomSizeInput('');
      return;
    }

    const nextSizeStock = [...(formData.size_stock || []), { size: normalized, stock: 0 }];
    setFormData((prev) => ({
      ...prev,
      size_stock: nextSizeStock,
      stock: nextSizeStock.reduce((sum, item) => sum + (Number(item.stock) || 0), 0),
    }));
    setCustomSizeInput('');
    clearFieldError('size_stock');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Campo obrigatório';
    if (!formData.description.trim()) errors.description = 'Campo obrigatório';
    if (!formData.price || formData.price <= 0) errors.price = 'Introduza um preço válido';
    if (!formData.category_id) errors.category_id = 'Selecione uma categoria';
    if (!isEdit && selectedFiles.length === 0) errors.images = 'Adicione pelo menos uma imagem';
    if (formData.stock_mode !== 'unit' && (!formData.size_stock || formData.size_stock.length === 0)) {
      errors.size_stock = 'Adicione pelo menos um tamanho para este tipo de produto';
    }
    if (selectedFiles.length > 0 && (!formData.colors || formData.colors.length === 0)) {
      errors.colors = 'Defina cores disponíveis antes de associar imagens';
    }
            if (selectedFiles.length > 0 && imageColors.some((color) => !color?.name)) {
      errors.imageColors = 'Associe uma cor a cada nova imagem';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Scroll to first invalid field
      if (errors.name) {
        nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameRef.current?.focus();
      } else if (errors.description) {
        descriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        descriptionRef.current?.focus();
      } else if (errors.price) {
        priceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        priceRef.current?.focus();
      } else if (errors.stock) {
        stockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        stockRef.current?.focus();
      }
      return;
    }
    setFieldErrors({});

    setLoading(true);

    try {

      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price.toString());
      if (formData.weight) {
        formDataToSend.append('weight', formData.weight.toString());
      }
      formDataToSend.append('category', formData.category_id.toString());
      const hasSizeStock = (formData.size_stock || []).length > 0;
      const totalSizeStock = (formData.size_stock || []).reduce(
        (sum, item) => sum + (Number(item.stock) || 0),
        0
      );

      formDataToSend.append('stockMode', formData.stock_mode);
      formDataToSend.append(
        'stock',
        (formData.stock_mode === 'unit' ? formData.stock : totalSizeStock).toString()
      );
      formDataToSend.append('featured', formData.featured.toString());
      
      // Append existing images (for edit mode)
      if (isEdit && existingImages.length > 0) {
        console.log('📋 Existing images to keep:', existingImages);
        formDataToSend.append('existingImages', JSON.stringify(existingImages));
      }

      // Append colors
      if (formData.colors && formData.colors.length > 0) {
        formDataToSend.append('colors', JSON.stringify(formData.colors));
      }

      if (formData.stock_mode !== 'unit' && hasSizeStock) {
        formDataToSend.append('sizeStock', JSON.stringify(formData.size_stock));
      } else {
        formDataToSend.append('sizeStock', JSON.stringify([]));
      }

      // Append one color per new image (same order as selectedFiles)
      if (selectedFiles.length > 0) {
        formDataToSend.append(
          'imageColors',
          JSON.stringify(imageColors.map((color) => color?.name || ''))
        );
      }
      
      // Append new image files
      console.log('📤 Uploading new files:', selectedFiles.length);
      selectedFiles.forEach((file, index) => {
        console.log(`  📸 File ${index + 1}:`, file.name, file.type, file.size);
        formDataToSend.append('images', file);
      });

      // Debug: Log all FormData entries
      console.log('📦 FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}:`, value.name, value.type, value.size);
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      if (isEdit) {
        await productsApi.update(Number(id), formDataToSend);
      } else {
        await productsApi.create(formDataToSend);
      }
      navigate('/admin/produtos');
    } catch (err: any) {
      setError(err.message || 'Falha ao guardar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/produtos')}
          className="p-3 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEdit ? 'Editar Produto' : 'Adicionar Novo Produto'}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                id="product-name"
                name="name"
                ref={nameRef}
                type="text"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); clearFieldError('name'); }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
              />
              {fieldErrors.name && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.name}</p>}
            </div>

            <div>
              <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <AdminSelect
                id="product-category"
                name="category"
                value={formData.category_id}
                onChange={(value) => {
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue)) {
                    setFormData({ ...formData, category_id: numValue });
                    clearFieldError('category_id');
                  }
                }}
                wrapperClassName="w-full"
                placeholder="Selecione uma categoria"
                options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
              />
              {fieldErrors.category_id && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.category_id}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              id="product-description"
              name="description"
              ref={descriptionRef}
              value={formData.description}
              onChange={(e) => { setFormData({ ...formData, description: e.target.value }); clearFieldError('description'); }}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${fieldErrors.description ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.description && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-2">
                Preço (€) *
              </label>
              <input
                id="product-price"
                name="price"
                ref={priceRef}
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => { setFormData({ ...formData, price: parseFloat(e.target.value) }); clearFieldError('price'); }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${fieldErrors.price ? 'border-red-500' : 'border-gray-300'}`}
              />
              {fieldErrors.price && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.price}</p>}
            </div>

            <div>
              <label htmlFor="product-weight" className="block text-sm font-medium text-gray-700 mb-2">
                Peso (gramas)
              </label>
              <input
                id="product-weight"
                name="weight"
                type="number"
                min="1"
                placeholder="Ex: 350"
                value={formData.weight || ''}
                onChange={(e) => { setFormData({ ...formData, weight: e.target.value ? parseInt(e.target.value, 10) : undefined }); clearFieldError('weight'); }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${fieldErrors.weight ? 'border-red-500' : 'border-gray-300'}`}
              />
              {fieldErrors.weight && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.weight}</p>}
              <p className="mt-1 text-xs text-gray-500">Opcional</p>
            </div>

            <div>
              <label htmlFor="product-type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Produto
              </label>
              <AdminSelect
                id="product-type"
                name="stock_mode"
                value={formData.stock_mode}
                onChange={(value) => handleStockModeChange(value as StockMode)}
                wrapperClassName="w-full"
                options={[
                  { value: 'unit', label: 'Sem tamanhos (ex: chapéus, acessórios)' },
                  { value: 'apparel', label: 'Com tamanhos de roupa (XS, S, M...)' },
                  { value: 'shoes', label: 'Com tamanhos de calçado (35, 36, 37...)' },
                ]}
              />
              <p className="mt-1 text-xs text-gray-500">
                Este campo controla quais opções de stock são mostradas abaixo.
              </p>
            </div>

            {formData.stock_mode === 'unit' && (
              <div>
                <label htmlFor="product-stock" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <input
                  id="product-stock"
                  name="stock"
                  ref={stockRef}
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => {
                    setFormData({ ...formData, stock: parseInt(e.target.value) || 0 });
                    clearFieldError('stock');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destaque
              </label>
              <div className="flex items-center gap-4 h-[42px]">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="product-featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="product-featured" className="ml-2 text-gray-700">Produto em Destaque</label>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagens do Produto * (a primeira será a principal)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              As imagens serão automaticamente otimizadas e convertidas para WebP para melhor performance
            </p>
            {fieldErrors.images && <p className="mb-3 text-sm text-red-500">{fieldErrors.images}</p>}
            <div className="space-y-4">
              {/* File Upload */}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-tertiary-100 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Clique para upload ou tirar foto</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP até 10MB</p>
                    <p className="text-xs text-gray-400 mt-1">Imagens convertidas automaticamente para WebP</p>
                  </div>
                  <input
                    id="product-images"
                    name="images"
                    type="file"
                    multiple
                    accept="image/*;capture=camera"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className={`relative group flex flex-col bg-white rounded-lg border-2 overflow-hidden transition-all shadow-sm hover:shadow-md ${
                        index === 0 ? 'border-primary-600' : 'border-gray-200 hover:border-primary-400'
                      } ${draggedIndex === index ? 'opacity-30 scale-95' : ''} ${
                        dragOverIndex === index ? 'ring-4 ring-primary-500 ring-opacity-50 scale-105 z-10' : ''
                      }`}
                      draggable
                      onDragStart={(e) => {
                        setDraggedIndex(index);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', index.toString());

                        const img = new Image();
                        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
                        e.dataTransfer.setDragImage(img, 0, 0);

                        setMouseDragPosition({ x: e.clientX, y: e.clientY });

                        const handleMouseMove = (e: MouseEvent) => {
                          setMouseDragPosition({ x: e.clientX, y: e.clientY });
                        };
                        document.addEventListener('dragover', handleMouseMove as any);

                        const cleanup = () => {
                          document.removeEventListener('dragover', handleMouseMove as any);
                          document.removeEventListener('dragend', cleanup);
                        };
                        document.addEventListener('dragend', cleanup);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                        setMouseDragPosition(null);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        if (draggedIndex !== index) {
                          setDragOverIndex(index);
                        }
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        dragCounter.current--;
                        if (dragCounter.current === 0) {
                          setDragOverIndex(null);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        dragCounter.current++;
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        dragCounter.current = 0;
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        if (!isNaN(fromIndex) && fromIndex !== index) {
                          moveImage(fromIndex, index);
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      // Touch handlers remain the same...
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        const rect = e.currentTarget.getBoundingClientRect();
                        touchStartPos.current = {
                          x: touch.clientX - rect.left,
                          y: touch.clientY - rect.top
                        };
                        touchedElement.current = e.currentTarget as HTMLDivElement;

                        dragTimeout.current = setTimeout(() => {
                          if (touchStartPos.current) {
                            setDraggedIndex(index);
                            setTouchDragPosition({ x: touch.clientX, y: touch.clientY });
                            document.body.style.overflow = 'hidden';
                          }
                        }, 150);
                      }}
                      onTouchMove={(e) => {
                        if (draggedIndex !== index || !touchStartPos.current) {
                          if (touchStartPos.current && dragTimeout.current) {
                            const touch = e.touches[0];
                            const rect = e.currentTarget.getBoundingClientRect();
                            const deltaX = Math.abs(touch.clientX - rect.left - touchStartPos.current.x);
                            const deltaY = Math.abs(touch.clientY - rect.top - touchStartPos.current.y);

                            if (deltaX > 10 || deltaY > 10) {
                              clearTimeout(dragTimeout.current);
                              dragTimeout.current = null;
                            }
                          }
                          return;
                        }
                        e.preventDefault();
                        const touch = e.touches[0];
                        setTouchDragPosition({ x: touch.clientX, y: touch.clientY });

                        const element = document.elementFromPoint(touch.clientX, touch.clientY);
                        const targetContainer = element?.closest('[data-image-index]');
                        if (targetContainer) {
                          const targetIndex = parseInt(targetContainer.getAttribute('data-image-index') || '-1');
                          if (targetIndex !== -1 && targetIndex !== index) {
                            setDragOverIndex(targetIndex);
                          } else {
                            setDragOverIndex(null);
                          }
                        } else {
                          setDragOverIndex(null);
                        }
                      }}
                      onTouchEnd={(e) => {
                        if (dragTimeout.current) {
                          clearTimeout(dragTimeout.current);
                          dragTimeout.current = null;
                        }
                        if (draggedIndex === index && dragOverIndex !== null && dragOverIndex !== index) {
                          moveImage(index, dragOverIndex);
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                        setTouchDragPosition(null);
                        touchStartPos.current = null;
                        touchedElement.current = null;
                        document.body.style.overflow = '';
                      }}
                      onTouchCancel={(e) => {
                        if (dragTimeout.current) {
                          clearTimeout(dragTimeout.current);
                          dragTimeout.current = null;
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                        setTouchDragPosition(null);
                        touchStartPos.current = null;
                        touchedElement.current = null;
                        document.body.style.overflow = '';
                      }}
                      data-image-index={index}
                    >
                      
                      {/* Control Header Bar */}
                      <div className="flex justify-between items-center bg-gray-50 border-b border-gray-200 px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="cursor-move text-gray-400 hover:text-gray-700 p-1 rounded transition-colors" title="Arrastar para reordenar">
                            <GripVertical size={16} />
                          </div>
                          {index === 0 && (
                            <span className="bg-primary-100 text-primary-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Principal
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          onTouchEnd={(e) => {
                            e.stopPropagation();
                          }}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                          aria-label="Remover imagem"
                          title="Remover"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Image Area */}
                      <div className="relative aspect-square bg-gray-100">
                        <img
                          src={preview}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Erro';
                          }}
                        />
                        {index > 0 && (
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
                            #{index + 1}
                          </div>
                        )}
                      </div>

                      {/* Footer Area (Color Select) */}
                      {index >= existingImages.length && (
                        <div className="p-2 border-t border-gray-200 bg-white">
                          <select
                            id={`image-color-${index}`}
                            name={`imageColor-${index}`}
                            aria-label={`Cor associada à imagem ${index + 1}`}
                            value={imageColors[index - existingImages.length]?.name || ''}
                            onChange={(e) => {
                              const fileIndex = index - existingImages.length;
                              const value = e.target.value;
                              const selected = (formData.colors || []).find((c) => c.name === value);
                              setImageColors((prev) => {
                                const next = [...prev];
                                next[fileIndex] = selected || { name: '', hex: '' };
                                return next;
                              });
                              clearFieldError('imageColors');
                            }}
                            className="w-full text-sm pl-2 pr-8 py-1.5 rounded-md border border-gray-300 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all cursor-pointer text-gray-700"
                          >
                            <option value="" disabled className="text-gray-400">Associar cor...</option>
                            {(formData.colors || []).map((color) => (
                              <option key={`${index}-${color.name}`} value={color.name}>
                                {color.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Floating drag preview for touch devices */}
                {draggedIndex !== null && touchDragPosition && (
                  <div
                    className="fixed pointer-events-none z-[100] md:hidden"
                    style={{
                      left: touchDragPosition.x - 60,
                      top: touchDragPosition.y - 60,
                      width: '120px',
                      height: '120px',
                    }}
                  >
                    <div className="relative w-full h-full animate-pulse-slow">
                      <img
                        src={imagePreviews[draggedIndex]}
                        alt="Arrastando"
                        className="w-full h-full object-cover rounded-lg border-2 border-primary-500 shadow-2xl opacity-90 transform rotate-3"
                      />
                      <div className="absolute inset-0 bg-primary-500/20 rounded-lg"></div>
                      <div className="absolute bottom-1 left-1 bg-primary-600 text-white text-xs px-2 py-1 rounded font-semibold">
                        {draggedIndex === 0 ? 'Principal' : `#${draggedIndex + 1}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating drag preview for desktop */}
                {draggedIndex !== null && mouseDragPosition && (
                  <div
                    className="fixed pointer-events-none z-[100] hidden md:block"
                    style={{
                      left: mouseDragPosition.x - 60,
                      top: mouseDragPosition.y - 60,
                      width: '120px',
                      height: '120px',
                    }}
                  >
                    <div className="relative w-full h-full animate-pulse-slow">
                      <img
                        src={imagePreviews[draggedIndex]}
                        alt="Arrastando"
                        className="w-full h-full object-cover rounded-lg border-2 border-primary-500 shadow-2xl opacity-90 transform rotate-3"
                      />
                      <div className="absolute inset-0 bg-primary-500/20 rounded-lg"></div>
                      <div className="absolute bottom-1 left-1 bg-primary-600 text-white text-xs px-2 py-1 rounded font-semibold">
                        {draggedIndex === 0 ? 'Principal' : `#${draggedIndex + 1}`}
                      </div>
                    </div>
                  </div>
                )}
                </>
              )}

              {imagePreviews.length === 0 && (
                <p className="text-sm text-gray-500 text-center">Nenhuma imagem adicionada</p>
              )}
              {fieldErrors.imageColors && <p className="text-sm text-red-500">{fieldErrors.imageColors}</p>}
            </div>
          </div>

          {/* Colors Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cores Disponíveis
            </label>
            <ColorPicker
              selectedColors={formData.colors || []}
              onColorsChange={(colors) => {
                setFormData({ ...formData, colors });
                clearFieldError('colors');
              }}
            />
            {fieldErrors.colors && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.colors}</p>}
          </div>

          {/* Sizes Section */}
          {formData.stock_mode !== 'unit' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanhos e Stock por Tamanho
            </label>
            <p className="text-xs text-gray-500 mb-3">
              {formData.stock_mode === 'shoes'
                ? 'Use tamanhos numéricos de calçado (35, 36, 37...). O stock total é automático.'
                : 'Use tamanhos de roupa (XS, S, M...) ou personalizados. O stock total é automático.'}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {(formData.stock_mode === 'shoes' ? SHOE_SIZES : APPAREL_SIZES).map((size) => {
                const selected = (formData.size_stock || []).some((item) => item.size === size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleToggleSize(size)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                id="custom-size"
                name="customSize"
                type="text"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSize();
                  }
                }}
                placeholder="Adicionar tamanho customizado (ex: 38, 42, 43, Único)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomSize}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors"
              >
                Adicionar tamanho
              </button>
            </div>

            {(formData.size_stock || []).length > 0 && (
              <div className="space-y-3">
                {(formData.size_stock || []).map((item) => (
                  <div key={item.size} className="flex items-center gap-3">
                    <span className="w-14 text-sm font-semibold text-gray-700">{item.size}</span>
                    <input
                      id={`size-stock-${item.size}`}
                      name={`size-stock-${item.size}`}
                      aria-label={`Stock para tamanho ${item.size}`}
                      type="number"
                      min="0"
                      value={item.stock}
                      onChange={(e) => handleSizeStockChange(item.size, e.target.value)}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    <span className="text-sm text-gray-500">unidades</span>
                  </div>
                ))}
              </div>
            )}
            {fieldErrors.size_stock && <p className="mt-1.5 text-sm text-red-500">{fieldErrors.size_stock}</p>}
          </div>
          )}

          <div className="flex items-center space-x-4 pt-6 border-t border-secondary-200">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-50 flex items-center touch-manipulation min-h-[44px]"
            >
              <Save size={20} className="mr-2" />
              {loading ? 'A guardar...' : (isEdit ? 'Atualizar Produto' : 'Criar Produto')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/produtos')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-tertiary-100 active:bg-gray-100 transition-colors touch-manipulation min-h-[44px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
