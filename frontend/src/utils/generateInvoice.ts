export interface InvoiceOrderItem {
  id: number;
  quantity: number;
  price: number;
  product: { id: number; name: string; image: string; images?: string[] };
  color?: string;
  size?: string;
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
  delivery_country?: string;
  vat_rate?: number;
  order_items: InvoiceOrderItem[];
}

const toColorSlug = (value: string): string =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

const getItemImage = (item: InvoiceOrderItem): string => {
  const images = item.product.images;
  if (!images || images.length === 0) return item.product.image || '';
  if (!item.color) return images[0];
  const slug = toColorSlug(item.color);
  return images.find(img => img.toLowerCase().includes(slug)) || images[0];
};

const toAbsoluteUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${window.location.origin}/api/images${path}`;
};

const paymentLabel = (method: string): string => {
  switch (method?.toLowerCase()) {
    case 'mbway': return 'MBWay';
    case 'multibanco': return 'Multibanco';
    case 'stripe':
    case 'card': return 'Cartão de Crédito';
    default: return method ?? '—';
  }
};

export const getInvoiceHtml = (order: InvoiceOrder): string => {
  const total = Number(order.total);
  const vatRate = order.vat_rate ?? 0.23;
  const vatRatePct = Math.round(vatRate * 100);
  const subtotalExVat = total / (1 + vatRate);
  const vatAmount = total - subtotalExVat;
  const orderDate = new Date(order.created_at).toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const year = new Date(order.created_at).getFullYear();
  const invoiceNumber = `${year}-${String(order.id).padStart(4, '0')}`;
  const logoUrl = `${window.location.origin}/images/logo.png`;

  const itemsHtml = order.order_items.map(item => {
    const imgUrl = toAbsoluteUrl(getItemImage(item));
    const meta = [
      item.color ? `Cor: ${item.color}` : '',
      item.size ? `Tam: ${item.size}` : '',
    ].filter(Boolean).join(' | ');
    return `
    <tr>
      <td class="td-name">
        <div class="item-row">
          ${imgUrl ? `<img src="${imgUrl}" alt="${item.product.name}" class="item-img" onerror="this.style.display='none'" />` : ''}
          <div>
            <div class="item-name">${item.product.name}</div>
            ${meta ? `<div class="item-meta">${meta}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="td-center">${item.quantity}</td>
      <td class="td-right">${Number(item.price).toFixed(2)}€</td>
      <td class="td-right td-bold">${(item.quantity * Number(item.price)).toFixed(2)}€</td>
    </tr>
  `;
  }).join('');

  const statusBadge = order.payment_status === 'paid'
    ? '<span class="badge-paid">PAGO</span>'
    : `<span>${order.payment_status}</span>`;

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Fatura ${invoiceNumber} · Recicloth</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* CSS Reset for Print */
    @page { 
      margin: 0; /* REMOVE OS CABEÇALHOS E RODAPÉS DO BROWSER (about:blank, data, etc) */
      size: A4;
    }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background: #f9f9f9;
      color: #111827;
      padding: 40px;
      -webkit-font-smoothing: antialiased;
      -webkit-user-select: text;
      user-select: text;
    }

    @media print {
      body { 
        background: white; 
        padding: 40px !important; /* Margem interna da folha */
      }
      .invoice-wrapper { 
        box-shadow: none !important; 
        margin: 0 !important; 
        border: none !important;
      }
    }

    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,.05);
    }

    /* TOP STRIPE DA MARCA */
    .stripe-top {
      height: 12px;
      background: #1E4D3B; /* Verde floresta escuro */
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 48px 48px 40px;
    }

    .brand img { height: 45px; width: auto; object-fit: contain; }

    .inv-title-block { text-align: right; }
    .inv-title {
      font-size: 32px; 
      font-weight: 800; 
      letter-spacing: -0.5px;
      color: #111827;
      margin-bottom: 8px;
    }
    .inv-number { font-size: 14px; color: #6b7280; font-weight: 500; }
    .inv-date   { font-size: 14px; color: #6b7280; margin-top: 2px; }

    .info-band {
      display: flex;
      justify-content: space-between;
      gap: 32px;
      padding: 32px 48px;
      background: #f8fafc; /* Cinza muito claro */
      border-top: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
    }
    
    .info-block { flex: 1; }
    .info-block h4 {
      font-size: 11px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: #94a3b8; margin-bottom: 12px;
    }
    .info-block p { font-size: 14px; line-height: 1.6; color: #334155; }
    .info-block .strong { font-weight: 700; color: #0f172a; margin-bottom: 4px; }

    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px; }
    .meta-label {
      font-size: 11px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;
    }
    .meta-val { font-size: 14px; font-weight: 600; color: #0f172a; }
    
    .badge-paid {
      display: inline-block; background: #dcfce7; color: #166534;
      padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;
    }

    .items-wrap { padding: 40px 48px 24px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { border-bottom: 2px solid #e2e8f0; }
    thead th {
      padding: 12px 8px; font-size: 11px; font-weight: 700; color: #64748b;
      letter-spacing: 1px; text-transform: uppercase;
    }
    thead th:first-child { text-align: left; padding-left: 0; }
    thead th:last-child  { padding-right: 0; text-align: right; }
    
    .td-name   { padding: 16px 8px 16px 0; border-bottom: 1px solid #f1f5f9; }
    .item-row  { display: flex; align-items: center; gap: 14px; }
    .item-img  { width: 56px; height: 56px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; flex-shrink: 0; }
    .item-name { font-size: 14px; font-weight: 600; color: #0f172a; }
    .item-meta { font-size: 12px; color: #64748b; margin-top: 4px; }
    
    .td-center { padding: 16px 8px; text-align: center; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .td-right  { padding: 16px 8px; text-align: right; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; }
    .td-right:last-child { padding-right: 0; }
    .td-bold   { font-weight: 700; color: #0f172a; }

    .totals-wrap { display: flex; justify-content: flex-end; padding: 16px 48px 48px; }
    .totals-box { width: 320px; }
    .t-row {
      display: flex; justify-content: space-between;
      padding: 12px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9;
    }
    .t-row:last-child { border-bottom: none; }
    .t-row .lbl { color: #64748b; font-weight: 500; }
    .t-row .val { color: #0f172a; font-weight: 500; }
    .t-row .free { color: #16a34a; font-weight: 600; }
    
    .t-row.t-total {
      margin-top: 8px;
      padding-top: 16px;
      border-top: 2px solid #1E4D3B;
      font-size: 18px; 
    }
    .t-row.t-total .lbl { color: #0f172a; font-weight: 800; }
    .t-row.t-total .val { color: #1E4D3B; font-weight: 800; }

    .invoice-footer {
      padding: 32px 48px;
      text-align: center;
    }
    .invoice-footer p { font-size: 12px; color: #64748b; font-weight: 500; }
    .invoice-footer .note { margin-top: 6px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="stripe-top"></div>

    <div class="invoice-header">
      <div class="brand">
        <img src="${logoUrl}" alt="Recicloth" onerror="this.style.display='none'" />
      </div>
      <div class="inv-title-block">
        <div class="inv-title">FATURA</div>
        <div class="inv-number">#${invoiceNumber}</div>
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
        <h4>Detalhes</h4>
        <div class="meta-grid">
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
            <th>Descrição</th>
            <th style="text-align:center">Qtd</th>
            <th style="text-align:right">Preço</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <div class="totals-wrap">
      <div class="totals-box">
        <div class="t-row">
          <span class="lbl">Subtotal (s/ IVA)</span>
          <span class="val">${subtotalExVat.toFixed(2)}€</span>
        </div>
        <div class="t-row">
          <span class="lbl">IVA (${vatRatePct}%)</span>
          <span class="val">${vatAmount.toFixed(2)}€</span>
        </div>
        <div class="t-row">
          <span class="lbl">Portes de Envio</span>
          <span class="free">Grátis</span>
        </div>
        <div class="t-row t-total">
          <span class="lbl">Total</span>
          <span class="val">${total.toFixed(2)}€</span>
        </div>
      </div>
    </div>

    <div class="invoice-footer">
      <p>Recicloth — Moda Sustentável e Upcycled</p>
      <p class="note">Este documento é meramente informativo e não substitui uma fatura fiscal oficial.</p>
    </div>
  </div>
</body>
</html>`;
};