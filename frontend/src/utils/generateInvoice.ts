export interface InvoiceOrderItem {
  id: number;
  quantity: number;
  price: number;
  product: { id: number; name: string; image: string };
}

export interface InvoiceOrder {
  id: number;
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_postal_code: string;
  order_items: InvoiceOrderItem[];
}

const paymentLabel = (method: string): string => {
  switch (method?.toLowerCase()) {
    case 'mbway': return 'MBWay';
    case 'multibanco': return 'Multibanco';
    case 'stripe':
    case 'card': return 'Cartão de Crédito';
    case 'eupago': return 'EuPago';
    default: return method ?? '—';
  }
};

export const getInvoiceHtml = (order: InvoiceOrder): string => {
  const total = Number(order.total);
  const subtotalExVat = total / 1.23;
  const vatAmount = total - subtotalExVat;
  const orderDate = new Date(order.created_at).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const year = new Date(order.created_at).getFullYear();
  const invoiceNumber = `${year}-${String(order.id).padStart(4, '0')}`;
  const logoUrl = `${window.location.origin}/images/logo.webp`;

  const itemsHtml = order.order_items.map(item => `
    <tr>
      <td class="td-name">${item.product.name}</td>
      <td class="td-center">${item.quantity}</td>
      <td class="td-right">${Number(item.price).toFixed(2)}€</td>
      <td class="td-right td-bold">${(item.quantity * Number(item.price)).toFixed(2)}€</td>
    </tr>
  `).join('');

  const statusBadge = order.payment_status === 'paid'
    ? '<span class="badge-paid">Pago</span>'
    : `<span>${order.payment_status}</span>`;

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Fatura ${invoiceNumber} · Arte em Ponto</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #f7f0eb;
      color: #2c1810;
      padding: 32px 16px 48px;
    }

    @media print {
      body { background: white; padding: 0; }
      .invoice-wrapper { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
      @page { margin: 12mm 14mm; size: A4; }
    }

    .invoice-wrapper {
      max-width: 820px;
      margin: 0 auto;
      background: #fff;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 6px 48px rgba(0,0,0,.13);
    }

    .stripe-top {
      height: 10px;
      background: linear-gradient(90deg, #5a2810 0%, #9c4e28 40%, #c87748 70%, #9c4e28 100%);
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 40px 52px 32px;
      border-bottom: 1px solid #ede0d4;
    }
    .brand { display: flex; align-items: center; gap: 18px; }
    .brand img { height: 72px; width: auto; object-fit: contain; }
    .brand-name { font-size: 22px; font-weight: 700; color: #7c3d1e; letter-spacing: .3px; }
    .brand-sub  { font-size: 12.5px; color: #a07060; margin-top: 4px; font-style: italic; }

    .inv-title-block { text-align: right; }
    .inv-title {
      font-size: 40px; font-weight: 700; letter-spacing: 4px;
      text-transform: uppercase; color: #7c3d1e;
    }
    .inv-number { font-size: 14px; color: #a07060; margin-top: 4px; }
    .inv-date   { font-size: 13px; color: #a07060; margin-top: 3px; }

    .info-band {
      display: flex;
      justify-content: space-between;
      gap: 32px;
      padding: 28px 52px;
      background: #fdf7f2;
      border-bottom: 1px solid #ede0d4;
    }
    .info-block h4 {
      font-size: 10px; font-weight: 700; letter-spacing: 1.8px;
      text-transform: uppercase; color: #a07060; margin-bottom: 12px;
    }
    .info-block p { font-size: 13.5px; line-height: 1.75; color: #2c1810; }
    .info-block .strong { font-weight: 700; }

    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 32px; }
    .meta-label {
      font-size: 10px; font-weight: 700; letter-spacing: 1.4px;
      text-transform: uppercase; color: #a07060; margin-bottom: 3px;
    }
    .meta-val { font-size: 13.5px; font-weight: 600; color: #2c1810; }
    .badge-paid {
      display: inline-block; background: #dcfce7; color: #166534;
      padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
    }

    .items-wrap { padding: 32px 52px 24px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #7c3d1e; color: #fff; }
    thead th {
      padding: 11px 10px; font-size: 11px; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase;
    }
    thead th:first-child { text-align: left; padding-left: 18px; }
    thead th:last-child  { padding-right: 18px; }
    .td-name   { padding: 13px 10px 13px 18px; font-size: 14px; border-bottom: 1px solid #f5ece4; }
    .td-center { padding: 13px 10px; text-align: center; font-size: 14px; border-bottom: 1px solid #f5ece4; }
    .td-right  { padding: 13px 10px; text-align: right; font-size: 14px; border-bottom: 1px solid #f5ece4; }
    .td-right:last-child { padding-right: 18px; }
    .td-bold   { font-weight: 700; }
    tbody tr:nth-child(even) { background: #fdf7f2; }

    .totals-wrap { display: flex; justify-content: flex-end; padding: 8px 52px 40px; }
    .totals-box { width: 300px; border: 1px solid #ede0d4; border-radius: 8px; overflow: hidden; }
    .t-row {
      display: flex; justify-content: space-between;
      padding: 10px 18px; font-size: 14px; border-bottom: 1px solid #f0e6de;
    }
    .t-row:last-child { border-bottom: none; }
    .t-row.t-total {
      background: #7c3d1e; color: #fff;
      font-size: 16px; font-weight: 700; padding: 13px 18px;
    }
    .t-row .lbl { color: #7a5040; }
    .t-row.t-total .lbl { color: #f0d0b8; }
    .free { color: #16a34a; font-weight: 600; }

    .ornament {
      text-align: center; color: #c8906a; font-size: 18px;
      letter-spacing: 8px; padding: 0 52px 12px;
    }

    .invoice-footer {
      border-top: 1px solid #ede0d4; padding: 20px 52px;
      background: #fdf7f2; text-align: center;
    }
    .invoice-footer p { font-size: 12px; color: #a07060; line-height: 1.9; }
    .invoice-footer .note { font-style: italic; margin-top: 4px; font-size: 11px; color: #c0a090; }

    .stripe-bottom {
      height: 7px;
      background: linear-gradient(90deg, #5a2810 0%, #9c4e28 40%, #c87748 70%, #9c4e28 100%);
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="stripe-top"></div>

    <div class="invoice-header">
      <div class="brand">
        <img src="${logoUrl}" alt="Arte em Ponto" onerror="this.style.display='none'" />
        <div>
          <div class="brand-name">Arte em Ponto</div>
          <div class="brand-sub">Artesanato em Crochê Feito à Mão</div>
        </div>
      </div>
      <div class="inv-title-block">
        <div class="inv-title">Fatura</div>
        <div class="inv-number">N.º ${invoiceNumber}</div>
        <div class="inv-date">${orderDate}</div>
      </div>
    </div>

    <div class="info-band">
      <div class="info-block">
        <h4>Faturado a</h4>
        <p class="strong">${order.customer_name}</p>
        <p>${order.customer_email}</p>
        ${order.customer_phone ? `<p>${order.customer_phone}</p>` : ''}
        <p style="margin-top:8px">${order.customer_address}</p>
        <p>${order.customer_postal_code} ${order.customer_city}</p>
      </div>
      <div class="info-block">
        <h4>Detalhes da Encomenda</h4>
        <div class="meta-grid">
          <div>
            <div class="meta-label">N.º Encomenda</div>
            <div class="meta-val">#${order.id}</div>
          </div>
          <div>
            <div class="meta-label">Data</div>
            <div class="meta-val">${orderDate}</div>
          </div>
          <div>
            <div class="meta-label">Pagamento</div>
            <div class="meta-val">${paymentLabel(order.payment_method)}</div>
          </div>
          <div>
            <div class="meta-label">Estado</div>
            <div class="meta-val">${statusBadge}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="items-wrap">
      <table>
        <thead>
          <tr>
            <th style="text-align:left">Produto</th>
            <th style="text-align:center">Qtd.</th>
            <th style="text-align:right">Preço Unit.</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <div class="ornament">· · ·</div>

    <div class="totals-wrap">
      <div class="totals-box">
        <div class="t-row">
          <span class="lbl">Subtotal (s/ IVA)</span>
          <span>${subtotalExVat.toFixed(2)}€</span>
        </div>
        <div class="t-row">
          <span class="lbl">IVA (23%)</span>
          <span>${vatAmount.toFixed(2)}€</span>
        </div>
        <div class="t-row">
          <span class="lbl">Envio</span>
          <span class="free">Grátis</span>
        </div>
        <div class="t-row t-total">
          <span class="lbl">Total</span>
          <span>${total.toFixed(2)}€</span>
        </div>
      </div>
    </div>

    <div class="invoice-footer">
      <p>Arte em Ponto · Artesanato em Crochê Feito à Mão</p>
      <p class="note">Este documento é meramente informativo e não substitui uma fatura fiscal oficial.</p>
    </div>
    <div class="stripe-bottom"></div>
  </div>
</body>
</html>`;
};
