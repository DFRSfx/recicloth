import React, { useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { InvoiceOrder, getInvoiceHtml } from '../utils/generateInvoice';
import Invoice from './Invoice';

interface InvoiceModalProps {
  order: InvoiceOrder;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const year = new Date(order.created_at).getFullYear();
  const invoiceNumber = `${year}-${String(order.id).padStart(4, '0')}`;

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Open a new window with the same HTML for printing
  const handlePrint = () => {
    const html = getInvoiceHtml(order);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.onload = () => win.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative flex flex-col m-4 sm:m-8 rounded-xl overflow-hidden shadow-2xl bg-gray-100 max-h-[calc(100vh-4rem)]">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pré-visualização</p>
            <p className="font-semibold text-gray-900 text-sm">Fatura N.º {invoiceNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <Printer className="h-4 w-4" />
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice preview — scrollable */}
        <div className="overflow-y-auto flex-1 p-6 bg-gray-200">
          <div className="max-w-3xl mx-auto bg-white rounded shadow-lg overflow-hidden">
            <Invoice order={order} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
