import PDFDocument from 'pdfkit';
import sharp from 'sharp';

const BRAND_GREEN = '#1E4D3B';
const LIGHT_GRAY = '#f8fafc';
const TEXT_DARK = '#111827';
const TEXT_MID = '#374151';
const TEXT_LIGHT = '#6b7280';
const BORDER = '#e2e8f0';

const paymentLabel = (method: string): string => {
  switch (method?.toLowerCase()) {
    case 'mbway': return 'MB WAY';
    case 'multibanco': return 'Multibanco';
    case 'stripe':
    case 'card': return 'Cartão de Crédito';
    default: return method ?? '—';
  }
};

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export interface InvoiceData {
  id: number;
  total: number;
  subtotal?: number;
  vat_amount?: number;
  shipping_cost?: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address: string;
  customer_city: string;
  customer_postal_code: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    color?: string;
    size?: string;
    image?: string;
  }>;
}

async function fetchImageAsJpeg(imagePath: string): Promise<Buffer | null> {
  try {
    const baseUrl = (
      process.env.BACKEND_URL ||
      process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
      'http://localhost:3001'
    ).replace(/\/$/, '');
    const url = imagePath.startsWith('http')
      ? imagePath
      : `${baseUrl}/api/images/${imagePath.replace(/^\//, '')}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const raw = Buffer.from(await res.arrayBuffer());
    // Convert to JPEG — pdfkit supports JPEG/PNG natively, not WebP
    return await sharp(raw).jpeg({ quality: 85 }).toBuffer();
  } catch {
    return null;
  }
}

export async function generateInvoicePdf(order: InvoiceData): Promise<Buffer> {
  // Pre-fetch all item images in parallel before starting the PDF
  const imageBuffers: (Buffer | null)[] = await Promise.all(
    order.items.map(item => item.image ? fetchImageAsJpeg(item.image) : Promise.resolve(null))
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Fatura Recicloth #${order.id}` } });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 96; // usable width (margins 48 each side)
    const LEFT = 48;
    const RIGHT = LEFT + W;

    const total = Number(order.total);
    const subtotal = order.subtotal ?? total / 1.23;
    const vatAmount = order.vat_amount ?? (total - subtotal);
    const shippingCost = order.shipping_cost ?? 0;

    const orderDate = new Date(order.created_at).toLocaleDateString('pt-PT', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    const year = new Date(order.created_at).getFullYear();
    const invoiceNumber = `${year}-${String(order.id).padStart(4, '0')}`;

    // ── Top brand stripe ──────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 10).fill(BRAND_GREEN);

    let y = 36;

    // ── Header: FATURA title (right) ──────────────────────────────────────────
    doc.fontSize(28).font('Helvetica-Bold').fillColor(TEXT_DARK)
      .text('FATURA', LEFT, y, { align: 'right', width: W });

    doc.fontSize(11).font('Helvetica').fillColor(TEXT_LIGHT)
      .text(`#${invoiceNumber}`, LEFT, y + 36, { align: 'right', width: W })
      .text(orderDate, LEFT, y + 52, { align: 'right', width: W });

    // "Recicloth" brand text (left)
    doc.fontSize(20).font('Helvetica-Bold').fillColor(BRAND_GREEN)
      .text('Recicloth', LEFT, y + 6);

    doc.fontSize(10).font('Helvetica').fillColor(TEXT_LIGHT)
      .text('Moda Sustentável e Upcycled', LEFT, y + 30);

    y = 110;

    // ── Info band (gray background) ───────────────────────────────────────────
    const bandH = 110;
    doc.rect(0, y, doc.page.width, bandH).fill(LIGHT_GRAY);
    doc.rect(0, y, doc.page.width, 1).fill(BORDER);
    doc.rect(0, y + bandH - 1, doc.page.width, 1).fill(BORDER);

    y += 16;
    const colW = W / 2;

    // Left: Billed to
    doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_LIGHT)
      .text('FATURADO A', LEFT, y, { characterSpacing: 1 });
    y += 14;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_DARK)
      .text(order.customer_name, LEFT, y, { width: colW - 16 });
    y += 14;
    doc.fontSize(10).font('Helvetica').fillColor(TEXT_MID)
      .text(order.customer_email, LEFT, y, { width: colW - 16 });
    if (order.customer_phone) {
      y += 12;
      doc.text(order.customer_phone, LEFT, y, { width: colW - 16 });
    }
    y += 14;
    doc.text(`${order.customer_address}`, LEFT, y, { width: colW - 16 });
    y += 12;
    doc.text(`${order.customer_postal_code} ${order.customer_city}`, LEFT, y, { width: colW - 16 });

    // Right: Payment details
    const rightX = LEFT + colW;
    let ry = 110 + 16;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_LIGHT)
      .text('PAGAMENTO', rightX, ry, { characterSpacing: 1 });
    ry += 14;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_DARK)
      .text(paymentLabel(order.payment_method), rightX, ry);
    ry += 20;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_LIGHT)
      .text('ESTADO', rightX, ry, { characterSpacing: 1 });
    ry += 12;
    if (order.payment_status === 'paid') {
      doc.roundedRect(rightX, ry - 2, 48, 16, 3).fill('#dcfce7');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#166534')
        .text('PAGO', rightX + 6, ry + 1);
    } else {
      doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_DARK)
        .text(order.payment_status, rightX, ry);
    }

    y = 110 + bandH + 20;

    // ── Items table ───────────────────────────────────────────────────────────
    const IMG_SIZE = 48;
    const IMG_GAP = 10;
    const colQty = 40;
    const colPrice = 80;
    const colTotal = 80;
    // Name column: full width minus image space (only if at least one item has an image)
    const hasAnyImage = imageBuffers.some(Boolean);
    const imgOffset = hasAnyImage ? IMG_SIZE + IMG_GAP : 0;
    const colName = W - imgOffset - colQty - colPrice - colTotal;

    // Table header
    doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_LIGHT);
    doc.text('DESCRIÇÃO', LEFT + imgOffset, y, { width: colName, characterSpacing: 1 });
    doc.text('QTD', LEFT + imgOffset + colName, y, { width: colQty, align: 'center', characterSpacing: 1 });
    doc.text('PREÇO', LEFT + imgOffset + colName + colQty, y, { width: colPrice, align: 'right', characterSpacing: 1 });
    doc.text('TOTAL', LEFT + imgOffset + colName + colQty + colPrice, y, { width: colTotal, align: 'right', characterSpacing: 1 });

    y += 14;
    doc.rect(LEFT, y, W, 2).fill(BORDER);
    y += 10;

    // Table rows
    order.items.forEach((item, i) => {
      const lineTotal = (item.price * item.quantity).toFixed(2);
      const meta = [
        item.color ? `Cor: ${item.color}` : '',
        item.size ? `Tam: ${item.size}` : '',
      ].filter(Boolean).join(' | ');
      const rowH = Math.max(meta ? 44 : 30, hasAnyImage ? IMG_SIZE + 10 : 0);

      // Product image
      const imgBuf = imageBuffers[i];
      if (imgBuf) {
        try {
          doc.image(imgBuf, LEFT, y + 2, {
            width: IMG_SIZE,
            height: IMG_SIZE,
            cover: [IMG_SIZE, IMG_SIZE],
          });
          // Rounded clip is not trivial in pdfkit, so we draw a border rect instead
          doc.rect(LEFT, y + 2, IMG_SIZE, IMG_SIZE).strokeColor(BORDER).lineWidth(0.5).stroke();
        } catch {
          // If image embedding fails, skip it silently
        }
      }

      const textX = LEFT + imgOffset;

      // Name
      doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_DARK)
        .text(item.name, textX, y + 2, { width: colName - 8, lineBreak: false });
      if (meta) {
        doc.fontSize(10).font('Helvetica').fillColor(TEXT_LIGHT)
          .text(meta, textX, y + 16, { width: colName - 8, lineBreak: false });
      }

      // Qty
      doc.fontSize(11).font('Helvetica').fillColor(TEXT_MID)
        .text(String(item.quantity), textX + colName, y + 2, { width: colQty, align: 'center', lineBreak: false });

      // Price
      doc.fontSize(11).font('Helvetica').fillColor(TEXT_MID)
        .text(`${Number(item.price).toFixed(2)}€`, textX + colName + colQty, y + 2, { width: colPrice, align: 'right', lineBreak: false });

      // Line total
      doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_DARK)
        .text(`${lineTotal}€`, textX + colName + colQty + colPrice, y + 2, { width: colTotal, align: 'right', lineBreak: false });

      y += rowH;
      doc.rect(LEFT, y - 4, W, 1).fill('#f1f5f9');
    });

    y += 12;

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalsX = RIGHT - 260;
    const totalsW = 260;

    const drawTotalRow = (label: string, value: string, bold = false, color = TEXT_MID, valueColor = TEXT_DARK) => {
      doc.fontSize(11)
        .font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(color)
        .text(label, totalsX, y, { width: totalsW * 0.6, lineBreak: false });
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(valueColor)
        .text(value, totalsX + totalsW * 0.6, y, { width: totalsW * 0.4, align: 'right', lineBreak: false });
      y += 18;
      doc.rect(totalsX, y - 3, totalsW, 1).fill('#f1f5f9');
    };

    drawTotalRow('Subtotal (s/ IVA)', `${subtotal.toFixed(2)}€`);
    drawTotalRow('IVA (23%)', `${vatAmount.toFixed(2)}€`);
    if (shippingCost > 0) {
      drawTotalRow('Portes de Envio', `${shippingCost.toFixed(2)}€`);
    } else {
      drawTotalRow('Portes de Envio', 'Grátis', false, TEXT_LIGHT, '#16a34a');
    }

    y += 4;
    doc.rect(totalsX, y, totalsW, 2).fill(BRAND_GREEN);
    y += 10;

    // Grand total
    doc.fontSize(14).font('Helvetica-Bold').fillColor(TEXT_DARK)
      .text('Total', totalsX, y, { width: totalsW * 0.6, lineBreak: false });
    doc.fillColor(BRAND_GREEN)
      .text(`${total.toFixed(2)}€`, totalsX + totalsW * 0.6, y, { width: totalsW * 0.4, align: 'right', lineBreak: false });

    // ── Footer (inline after totals, no fixed page position) ─────────────────
    y += 32;
    doc.rect(LEFT, y, W, 1).fill(BORDER);
    y += 12;
    doc.fontSize(10).font('Helvetica').fillColor(TEXT_LIGHT)
      .text('Recicloth — Moda Sustentável e Upcycled', LEFT, y, { align: 'center', width: W });
    y += 14;
    doc.fontSize(9).fillColor('#94a3b8')
      .text('Este documento é meramente informativo e não substitui uma fatura fiscal oficial.', LEFT, y, { align: 'center', width: W });

    doc.end();
  });
}
