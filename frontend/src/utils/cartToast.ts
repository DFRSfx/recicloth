export interface CartToastDetail {
  productId: string | number;
  colorName?: string;
  productName: string;
  image?: string;
  type?: 'added' | 'removed' | 'updated';
}

export const fireCartToast = (detail: CartToastDetail) => {
  window.dispatchEvent(new CustomEvent('recicloth:cart-toast', { detail }));
};
