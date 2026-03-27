import React, { useState } from 'react';
import { X, ShoppingBag, Heart, Minus, Plus } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { getAbsoluteImageUrl, imgVariant } from '../utils/imageUtils';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  if (!isOpen) return null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, selectedColor);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* Images */}
            <div>
              <div className="aspect-square mb-4 overflow-hidden rounded-lg">
                <img
                  src={getAbsoluteImageUrl(imgVariant(product.images[selectedImage], 'lg'))}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${
                        selectedImage === index ? 'border-primary-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={getAbsoluteImageUrl(imgVariant(image, 'sm'))}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h2 className="text-2xl font-semibold mb-2">{product.name}</h2>
              <p className="text-3xl font-bold text-primary-600 mb-4">
                {product.price.toFixed(2)}€
              </p>
              
              <p className="text-gray-600 mb-6">{product.description}</p>

              {/* Colors */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Cor:</h4>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        selectedColor === color
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-gray-300 text-gray-700 hover:border-primary-600'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Quantidade:</h4>
                <div className="flex items-center border border-gray-300 rounded-md w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 border-l border-r border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {product.inStock ? 'Adicionar ao Carrinho' : 'Esgotado'}
                </button>
                
                <button className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Heart className="h-5 w-5" />
                </button>
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;