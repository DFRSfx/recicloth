import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, ArrowLeft, Trash2, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
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

  // Estado Vazio
  if (items.length === 0) {
    return (
      <div className="bg-[#f9f9f9] min-h-[70vh] flex flex-col items-center justify-center py-16 sm:py-24">
        <SEO
          title="Carrinho de Compras"
          description="O seu carrinho de compras está vazio."
          canonical="/carrinho"
          ogType="website"
        />
        <div className="text-center max-w-md px-4 flex flex-col items-center animate-fade-in">
          <div className="mb-6">
            <div className="bg-white p-6 rounded-full shadow-sm inline-block">
                <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300" strokeWidth={1.5} />
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            O seu carrinho está vazio
          </h2>
          
          <p className="text-gray-500 mb-8 max-w-xs sm:max-w-sm mx-auto leading-relaxed text-[15px]">
            Adicione alguns produtos à sua coleção e eles aparecerão aqui.
          </p>
          
          <Link
            to="/loja"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-[#1E4D3B] text-white font-medium rounded hover:bg-[#163a2c] transition-all shadow-sm active:scale-95 w-full sm:w-auto"
          >
            Explorar Produtos
          </Link>
        </div>
      </div>
    );
  }

  // Estado com Produtos
  return (
    <div className="min-h-screen bg-[#f9f9f9] pb-16 pt-8 lg:pt-12">
      <SEO
        title="Carrinho de Compras"
        description={`O seu carrinho contém ${itemCount} itens.`}
        canonical="/carrinho"
        ogType="website"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header - Alinhado com o Print */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-5">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              Carrinho de Compras
            </h1>
            <p className="text-gray-600 mt-2 text-[15px]">
              Você tem {itemCount} {itemCount === 1 ? 'item selecionado' : 'itens selecionados'}
            </p>
          </div>
          
          <button
            onClick={() => setShowClearModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm text-[#dc2626] bg-white border border-[#fca5a5] rounded hover:bg-[#fef2f2] transition-colors w-full md:w-auto shadow-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Carrinho
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Lista de Itens (Coluna Esquerda) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
              <div className={`divide-y divide-gray-100 ${items.length > 3 ? 'max-h-[600px] overflow-y-auto hide-scrollbar' : ''}`}>
                {items.map((item) => (
                  <CartItem
                    key={`${item.product.id}-${item.selectedColor || 'default'}`}
                    item={item}
                    onNotify={(name, image, type) => setCartToast({ name, image, type })}
                  />
                ))}
              </div>
            </div>
            
            {/* Link Voltar - Desktop */}
            <div className="hidden lg:flex justify-start">
              <Link to="/loja" className="inline-flex items-center gap-2 text-[#1E4D3B] hover:text-[#163a2c] font-medium transition-all group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hover:underline">Continuar a Comprar</span>
              </Link>
            </div>
          </div>

          {/* Resumo do Pedido (Coluna Direita Sticky) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-6 lg:p-8 lg:sticky lg:top-24">
              
              <h3 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                Resumo do Pedido
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 text-[15px]">
                  <span>Subtotal (s/ IVA)</span>
                  <span className="font-medium text-gray-900">{subtotalExVat.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-600">Envio</span>
                  <span className="font-medium text-[#16a34a]">Grátis</span>
                </div>
                <div className="flex justify-between text-gray-600 text-[15px]">
                  <span>IVA (23%)</span>
                  <span className="font-medium text-gray-900">{ivaAmount.toFixed(2)}€</span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-5 mt-5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-bold text-gray-900">Total (c/ IVA)</span>
                    <span className="text-2xl font-bold text-[#1E4D3B]">
                      {total.toFixed(2)}€
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 text-right">
                    IVA incluído
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-8">
                <Link
                  to="/finalizar-compra"
                  className="w-full flex items-center justify-center gap-2 bg-[#1E4D3B] text-white py-4 px-6 rounded hover:bg-[#163a2c] transition-colors shadow-sm font-semibold text-[16px]"
                >
                  Finalizar Compra
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
                </Link>
                
                {/* Link Voltar - Centrado abaixo do botão */}
                <Link
                  to="/loja"
                  className="w-full text-center py-2 text-[#475569] hover:text-[#1E4D3B] font-medium text-[15px] hover:underline"
                >
                  Continuar a Comprar
                </Link>
              </div>

              {/* Selos de Confiança */}
              <div className="mt-8 pt-6 border-t border-gray-100 space-y-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#16a34a] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Pagamento Seguro</p>
                    <p className="text-xs text-gray-500 mt-0.5">Seus dados estão 100% protegidos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RefreshCw className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-[14px] font-bold text-gray-900">Devolução Fácil</p>
                    <p className="text-xs text-gray-500 mt-0.5">30 dias para devolução gratuita.</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowClearModal(false)}></div>
          
          <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2 tracking-tight">
              Limpar Carrinho?
            </h3>
            <p className="text-center text-gray-500 mb-8 text-[15px]">
              Tem a certeza que deseja remover todos os itens do carrinho? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 px-4 py-3 bg-[#dc2626] text-white rounded font-medium hover:bg-[#b91c1c] transition-colors"
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