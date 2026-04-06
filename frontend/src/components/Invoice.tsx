import React from 'react';
import { InvoiceOrder } from '../utils/generateInvoice';
import { getPaymentMethodLabel } from '../utils/paymentLabels';

interface Props {
  order: InvoiceOrder;
}

const Invoice: React.FC<Props> = ({ order }) => {
  const total = Number(order.total);
  const subtotalExVat = total / 1.23;
  const vatAmount = total - subtotalExVat;

  const orderDate = new Date(order.created_at).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const year = new Date(order.created_at).getFullYear();
  const invoiceNumber = `${year}-${String(order.id).padStart(4, '0')}`;

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#111827', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
      
      {/* Top stripe */}
      <div style={{ height: 12, background: '#1E4D3B' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '48px 48px 40px' }}>
        <img
          src="/images/logo.png"
          alt="Recicloth"
          style={{ height: 45, width: 'auto', objectFit: 'contain' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', color: '#111827', marginBottom: 8 }}>FATURA</div>
          <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>#{invoiceNumber}</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>{orderDate}</div>
        </div>
      </div>

      {/* Info band */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, padding: '32px 48px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>Faturado a</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: '#334155' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{order.customer_name}</div>
            <div>{order.customer_email}</div>
            {order.customer_phone && <div>{order.customer_phone}</div>}
            <div style={{ marginTop: 8 }}>{order.customer_address}</div>
            <div>{order.customer_postal_code} {order.customer_city}</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>Detalhes</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Pagamento</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{getPaymentMethodLabel(order.payment_method, 'pt')}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Estado</div>
              {order.payment_status === 'paid'
                ? <span style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>PAGO</span>
                : <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{order.payment_status}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div style={{ padding: '40px 48px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px 8px 12px 0', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'left' }}>Descrição</th>
              <th style={{ padding: '12px 8px', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>Qtd</th>
              <th style={{ padding: '12px 8px', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'right' }}>Preço</th>
              <th style={{ padding: '12px 0 12px 8px', fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '20px 8px 20px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{item.product.name}</div>
                </td>
                <td style={{ padding: '20px 8px', fontSize: 14, color: '#334155', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>{item.quantity}</td>
                <td style={{ padding: '20px 8px', fontSize: 14, color: '#334155', textAlign: 'right', borderBottom: '1px solid #f1f5f9' }}>{Number(item.price).toFixed(2)}€</td>
                <td style={{ padding: '20px 0 20px 8px', fontSize: 14, color: '#0f172a', textAlign: 'right', fontWeight: 700, borderBottom: '1px solid #f1f5f9' }}>{(item.quantity * Number(item.price)).toFixed(2)}€</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 48px 48px' }}>
        <div style={{ width: 320 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 14, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Subtotal (s/ IVA)</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>{subtotalExVat.toFixed(2)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 14, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>IVA (23%)</span>
            <span style={{ color: '#0f172a', fontWeight: 500 }}>{vatAmount.toFixed(2)}€</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: 14, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', fontWeight: 500 }}>Portes de Envio</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>Grátis</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 16, borderTop: '2px solid #1E4D3B', fontSize: 18 }}>
            <span style={{ color: '#0f172a', fontWeight: 800 }}>Total</span>
            <span style={{ color: '#1E4D3B', fontWeight: 800 }}>{total.toFixed(2)}€</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '32px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Recicloth — Moda Sustentável e Upcycled</p>
        <p style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>Este documento é meramente informativo e não substitui uma fatura fiscal oficial.</p>
      </div>

    </div>
  );
};

export default Invoice;