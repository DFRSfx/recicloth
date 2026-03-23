import React from 'react';
import { InvoiceOrder } from '../utils/generateInvoice';

interface Props {
  order: InvoiceOrder;
}

const stripe: React.CSSProperties = {
  height: 10,
  background: 'linear-gradient(90deg, #5a2810 0%, #9c4e28 40%, #c87748 70%, #9c4e28 100%)',
};

const stripeBottom: React.CSSProperties = {
  ...stripe,
  height: 7,
};

const Invoice: React.FC<Props> = ({ order }) => {
  const total = Number(order.total);
  const subtotalExVat = total / 1.23;
  const vatAmount = total - subtotalExVat;

  const orderDate = new Date(order.created_at).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const year = new Date(order.created_at).getFullYear();
  const invoiceNumber = `${year}-${String(order.id).padStart(4, '0')}`;

  const paymentLabel = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'mbway': return 'MBWay';
      case 'multibanco': return 'Multibanco';
      case 'stripe':
      case 'card': return 'Cartão de Crédito';
      default: return method ?? '—';
    }
  };

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", color: '#2c1810', background: '#fff' }}>
      {/* Top stripe */}
      <div style={stripe} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '40px 52px 32px', borderBottom: '1px solid #ede0d4' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <img
            src="/images/logo.webp"
            alt="Arte em Ponto"
            style={{ height: 72, width: 'auto', objectFit: 'contain' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3d1e', letterSpacing: '.3px' }}>Arte em Ponto</div>
            <div style={{ fontSize: 12.5, color: '#a07060', marginTop: 4, fontStyle: 'italic' }}>Artesanato em Crochê Feito à Mão</div>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: '#7c3d1e' }}>Fatura</div>
          <div style={{ fontSize: 14, color: '#a07060', marginTop: 4 }}>N.º {invoiceNumber}</div>
          <div style={{ fontSize: 13, color: '#a07060', marginTop: 3 }}>{orderDate}</div>
        </div>
      </div>

      {/* Info band */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, padding: '28px 52px', background: '#fdf7f2', borderBottom: '1px solid #ede0d4' }}>
        {/* Customer */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color: '#a07060', marginBottom: 12 }}>Faturado a</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.75 }}>
            <div style={{ fontWeight: 700 }}>{order.customer_name}</div>
            <div>{order.customer_email}</div>
            {order.customer_phone && <div>{order.customer_phone}</div>}
            <div style={{ marginTop: 8 }}>{order.customer_address}</div>
            <div>{order.customer_postal_code} {order.customer_city}</div>
          </div>
        </div>

        {/* Order meta grid */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color: '#a07060', marginBottom: 12 }}>Detalhes da Encomenda</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 32px' }}>
            {[
              { label: 'N.º Encomenda', value: `#${order.id}` },
              { label: 'Data', value: orderDate },
              { label: 'Pagamento', value: paymentLabel(order.payment_method) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#a07060', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.4px', textTransform: 'uppercase', color: '#a07060', marginBottom: 3 }}>Estado</div>
              {order.payment_status === 'paid'
                ? <span style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>Pago</span>
                : <div style={{ fontSize: 13.5, fontWeight: 600 }}>{order.payment_status}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div style={{ padding: '32px 52px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#7c3d1e', color: '#fff' }}>
              <th style={{ padding: '11px 10px 11px 18px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'left' }}>Produto</th>
              <th style={{ padding: '11px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>Qtd.</th>
              <th style={{ padding: '11px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'right' }}>Preço Unit.</th>
              <th style={{ padding: '11px 18px 11px 10px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 1 ? '#fdf7f2' : '#fff' }}>
                <td style={{ padding: '13px 10px 13px 18px', fontSize: 14, borderBottom: '1px solid #f5ece4' }}>{item.product.name}</td>
                <td style={{ padding: '13px 10px', fontSize: 14, textAlign: 'center', borderBottom: '1px solid #f5ece4' }}>{item.quantity}</td>
                <td style={{ padding: '13px 10px', fontSize: 14, textAlign: 'right', borderBottom: '1px solid #f5ece4' }}>{Number(item.price).toFixed(2)}€</td>
                <td style={{ padding: '13px 18px 13px 10px', fontSize: 14, textAlign: 'right', fontWeight: 700, borderBottom: '1px solid #f5ece4' }}>{(item.quantity * Number(item.price)).toFixed(2)}€</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ornament */}
      <div style={{ textAlign: 'center', color: '#c8906a', fontSize: 18, letterSpacing: 8, padding: '0 52px 12px' }}>· · ·</div>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 52px 40px' }}>
        <div style={{ width: 300, border: '1px solid #ede0d4', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { label: 'Subtotal (s/ IVA)', value: `${subtotalExVat.toFixed(2)}€`, highlight: false },
            { label: 'IVA (23%)', value: `${vatAmount.toFixed(2)}€`, highlight: false },
            { label: 'Envio', value: 'Grátis', green: true, highlight: false },
          ].map(({ label, value, green, highlight }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', fontSize: 14, borderBottom: '1px solid #f0e6de', background: highlight ? '#7c3d1e' : undefined, color: highlight ? '#fff' : undefined }}>
              <span style={{ color: green ? undefined : '#7a5040' }}>{label}</span>
              <span style={{ color: green ? '#16a34a' : undefined, fontWeight: green ? 600 : undefined }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 18px', fontSize: 16, fontWeight: 700, background: '#7c3d1e', color: '#fff' }}>
            <span style={{ color: '#f0d0b8' }}>Total</span>
            <span>{total.toFixed(2)}€</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #ede0d4', padding: '20px 52px', background: '#fdf7f2', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#a07060', lineHeight: 1.9 }}>Arte em Ponto · Artesanato em Crochê Feito à Mão</p>
        <p style={{ fontSize: 11, color: '#c0a090', fontStyle: 'italic', marginTop: 4 }}>Este documento é meramente informativo e não substitui uma fatura fiscal oficial.</p>
      </div>

      {/* Bottom stripe */}
      <div style={stripeBottom} />
    </div>
  );
};

export default Invoice;
