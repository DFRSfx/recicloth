import React from 'react';
import { useConfirmStore } from '../hooks/useConfirm';
import ConfirmModal from './ConfirmModal';

const GlobalConfirmModal: React.FC = () => {
  const { isOpen, title, message, confirmText, cancelText, confirmButtonClass, confirm, closeConfirm } = useConfirmStore();

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={closeConfirm}
      onConfirm={confirm}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmButtonClass={confirmButtonClass}
    />
  );
};

export default GlobalConfirmModal;
