import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO';
import CartItem from '../components/CartItem';
import CartToast from '../components/CartToast';
import { useCart } from '../context/CartContext';

const Cart: React.FC = () => {
  const { items, total, clearCart, itemCount } = useCart();
  
  // Estado para controlar o modal de confirmação
  const [showClearModal, setShowClearModal] = useState(false);
  const [cartToast, setCartToast] = useState<{ name: string; image?: string; type: 'added' | 'removed' | 'updated' } | null>(null);

  const shipping = 0;
  const subtotalExVat = total / 1.23;
  const ivaAmount = total - subtotalExVat;

  const handleConfirmClear = () => {
    clearCart();
    setShowClearModal(false);
  };

  // Estado Vazio - Ajustado para reduzir o espaço no topo
  if (items.length === 0) {
    return (
      <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center py-16 sm:py-24">
        <SEO
          title="Carrinho de Compras"
          description="Seu carrinho de compras está vazio."
          canonical="/carrinho"
          ogType="website"
        />
        <div className="text-center max-w-md px-4 flex flex-col items-center animate-fade-in">
          <div className="mb-6">
            <div className="bg-gray-50 p-6 rounded-full inline-block">
                <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300" strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Seu carrinho está vazio
          </h2>
          
          <p className="text-gray-500 mb-8 max-w-xs sm:max-w-sm mx-auto leading-relaxed text-sm sm:text-base">
            Adicione alguns produtos incríveis à sua coleção e eles aparecerão aqui.
          </p>
          
          <Link
            to="/loja"
            className="inline-flex items-center px-8 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            Explorar Produtos
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  // Estado com Produtos
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <SEO
        title="Carrinho de Compras"
        description={`Seu carrinho contém ${itemCount} itens.`}
        canonical="/carrinho"
        ogType="website"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header - Melhorado para Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Carrinho de Compras
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Você tem {itemCount} {itemCount === 1 ? 'item' : 'itens'} selecionados
            </p>
          </div>
          
          <button
            onClick={() => setShowClearModal(true)}
            className="inline-flex items-center justify-center sm:justify-start gap-2 px-4 py-2 text-sm text-red-600 bg-white sm:bg-transparent border border-red-200 sm:border-red-200 rounded-md hover:bg-red-50 transition-colors w-full sm:w-auto shadow-sm sm:shadow-none"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Carrinho
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Lista de Itens */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              {/* ADICIONADO: max-h-[600px] e overflow-y-auto */}
              {/* Isto cria um scroll interno se a lista for muito longa */}
              <div className={`divide-y divide-gray-100 ${items.length > 3 ? 'max-h-[600px] overflow-y-auto custom-scrollbar' : ''}`}>
                {items.map((item) => (
                  <CartItem
                    key={`${item.product.id}-${item.selectedColor || 'default'}`}
                    item={item}
                    onNotify={(name, image, type) => setCartToast({ name, image, type })}
                  />
                ))}
              </div>
            </div>
            
            <div className="hidden sm:flex justify-start pt-4">
                
              <Link to="/loja" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 active:text-primary-800 mb-6 font-medium transition-all duration-300 group hover:gap-3 active:gap-3">
                <ArrowRight className="h-4 w-4 mr-2 group-hover:-translate-x-1 group-active:-translate-x-1 transition-transform duration-300 rotate-180" />
                <span className="group-hover:underline group-active:underline">Continuar a Comprar</span>
              </Link>
            </div>
          </div>

          {/* Resumo do Pedido - Sticky apenas em Desktop */}
          <div className="lg:col-span-1 mt-4 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 lg:sticky lg:top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                Resumo do Pedido
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Subtotal (s/ IVA)</span>
                  <span className="font-medium">{subtotalExVat.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Envio</span>
                  <span className="font-medium text-green-600">Grátis</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>IVA (23%)</span>
                  <span className="font-medium">{ivaAmount.toFixed(2)}€</span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-semibold text-gray-900">Total (c/ IVA)</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {total.toFixed(2)}€
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-right mt-1">
                    IVA incluído
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to="/finalizar-compra"
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 px-6 rounded-md hover:bg-primary-700 transition-all shadow-sm hover:shadow active:scale-[0.99] font-semibold text-lg"
                >
                  Finalizar Compra
                  <ArrowRight className="h-5 w-5" />
                </Link>
                
                {/* Botão voltar visível apenas em mobile aqui */}
                <Link
                  to="/loja"
                  className="sm:hidden w-full flex items-center justify-center py-3 text-gray-600 hover:text-gray-900 font-medium text-sm"
                >
                  Continuar a Comprar
                </Link>
              </div>

              {/* Selos de Confiança */}
              <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pagamento Seguro</p>
                    <p className="text-xs text-gray-500">Seus dados estão 100% protegidos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Devolução Fácil</p>
                    <p className="text-xs text-gray-500">30 dias para devolução gratuita.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Notification */}
      {cartToast && (
        <CartToast
          productName={cartToast.name}
          productImage={cartToast.image}
          type={cartToast.type}
          onClose={() => setCartToast(null)}
        />
      )}

      {/* Modal de Confirmação de Limpeza */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 transform transition-all scale-100">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
              Limpar Carrinho?
            </h3>
            <p className="text-center text-gray-500 mb-6">
              Tem a certeza que deseja remover todos os itens do carrinho? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
              >
                Sim, Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;