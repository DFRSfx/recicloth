import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmButtonClass: string;
  onConfirm: (() => void) | null;
  openConfirm: (config: ConfirmConfig) => void;
  closeConfirm: () => void;
  confirm: () => void;
}

interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  confirmButtonClass: 'bg-red-600 hover:bg-red-700',
  onConfirm: null,

  openConfirm: (config: ConfirmConfig) => {
    set({
      isOpen: true,
      title: config.title,
      message: config.message,
      onConfirm: config.onConfirm,
      confirmText: config.confirmText || 'Confirmar',
      cancelText: config.cancelText || 'Cancelar',
      confirmButtonClass: config.confirmButtonClass || 'bg-red-600 hover:bg-red-700',
    });
  },

  closeConfirm: () => {
    set({
      isOpen: false,
      onConfirm: null,
    });
  },

  confirm: () => {
    const { onConfirm, closeConfirm } = get();
    if (onConfirm) {
      onConfirm();
    }
    closeConfirm();
  },
}));
