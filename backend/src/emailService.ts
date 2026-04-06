import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

interface EmailTranslations {
  [key: string]: {
    resetPassword: {
      subject: string;
      title: string;
      subtitle: string;
      greeting: string;
      message: string;
      shopName: string;
      buttonText: string;
      validFor: string;
      minutes: string;
      securityTip: string;
      copyright: string;
    };
    passwordChanged: {
      subject: string;
      title: string;
      subtitle: string;
      greeting: string;
      message: string;
      shopName: string;
      notYou: string;
      contactSupport: string;
      copyright: string;
    };
    orderConfirmation: {
      subject: string;
      title: string;
      subtitle: string;
      greeting: string;
      orderNumber: string;
      total: string;
      items: string;
      thankYou: string;
      copyright: string;
      shippingAddress: string;
      paymentMethod: string;
      yourProducts: string;
      orderDate: string;
      subtotal: string;
      shipping: string;
      vat: string;
      trackButton: string;
      disclaimer: string;
    };
    orderShipped: {
      subject: string;
      title: string;
      subtitle: string;
      greeting: string;
      bodyText: string;
      trackButton: string;
      shippingAddress: string;
      paymentMethod: string;
      yourProducts: string;
      shipped: string;
      orderDate: string;
      orderNumber: string;
      total: string;
      subtotal: string;
      shipping: string;
      vat: string;
      copyright: string;
      disclaimer: string;
    };
    emailVerification: {
      subject: string;
      title: string;
      subtitle: string;
      greeting: string;
      message: string;
      buttonText: string;
      validFor: string;
      copyright: string;
    };
  };
}

const emailTranslations: EmailTranslations = {
  pt: {
    resetPassword: {
      subject: 'Recuperação de Palavra-passe - Recicloth',
      title: 'Recuperar Palavra-passe',
      subtitle: 'Não se preocupe, nós ajudamos!',
      greeting: 'Olá',
      message: 'Recebemos um pedido para redefinir a palavra-passe da sua conta na',
      shopName: 'Recicloth',
      buttonText: 'Redefinir Palavra-passe',
      validFor: 'Este link é válido por',
      minutes: '15 minutos',
      securityTip: 'Nunca partilhe a sua palavra-passe. Se não solicitou esta recuperação, ignore este email.',
      copyright: '© {year} Recicloth - Todos os direitos reservados'
    },
    passwordChanged: {
      subject: 'Palavra-passe Alterada - Recicloth',
      title: 'Senha Redefinida!',
      subtitle: 'A sua conta está segura',
      greeting: 'Olá',
      message: 'A sua palavra-passe da',
      shopName: 'Recicloth',
      notYou: 'Se não realizou esta alteração, contacte-nos imediatamente.',
      contactSupport: 'Suporte: recicloth@exemplo.com',
      copyright: '© {year} Recicloth - Todos os direitos reservados'
    },
    orderConfirmation: {
      subject: 'Confirmação de Pedido #{orderNumber} - Recicloth',
      title: 'Obrigado pelo teu pedido! 🎉',
      subtitle: 'Já recebemos a tua encomenda.',
      greeting: 'Olá',
      orderNumber: 'Número do pedido',
      total: 'Total',
      items: 'Artigos',
      thankYou: 'Obrigado por comprar na Recicloth!',
      copyright: '© {{year}} Recicloth - Todos os direitos reservados',
      shippingAddress: 'Endereço de entrega',
      paymentMethod: 'Método de pagamento',
      yourProducts: 'Os teus produtos',
      orderDate: 'Data do pedido',
      subtotal: 'Subtotal',
      shipping: 'Envio',
      vat: 'IVA (23%)',
      trackButton: 'Acompanhar encomenda',
      disclaimer: 'Este e-mail é gerado automaticamente. Podes verificar o estado da tua encomenda na tua conta a qualquer altura.'
    },
    orderShipped: {
      subject: 'A tua encomenda está a caminho! #{{orderNumber}} - Recicloth',
      title: 'Encomenda enviada!',
      subtitle: 'A tua encomenda está a caminho',
      greeting: 'Olá',
      bodyText: 'A tua encomenda já saiu e está a caminho. Podes acompanhar o estado na tua conta.',
      trackButton: 'Acompanhar encomenda',
      shippingAddress: 'Endereço de entrega',
      paymentMethod: 'Método de pagamento',
      yourProducts: 'Os teus produtos',
      shipped: 'Enviado',
      orderDate: 'Data do pedido',
      orderNumber: 'Número do pedido',
      total: 'Total',
      subtotal: 'Subtotal',
      shipping: 'Envio',
      vat: 'IVA (23%)',
      copyright: '© {{year}} Recicloth - Todos os direitos reservados',
      disclaimer: 'Este e-mail é enviado automaticamente. Podes verificar o estado da tua encomenda na tua conta.'
    },
    emailVerification: {
      subject: 'Verificar Email - Recicloth',
      title: 'Verificar o seu Email',
      subtitle: 'Bem-vindo à Recicloth!',
      greeting: 'Olá',
      message: 'Para ativar a sua conta, por favor clique no botão abaixo:',
      buttonText: 'Verificar Email',
      validFor: 'Este link é válido por 24 horas',
      copyright: '© {year} Recicloth - Todos os direitos reservados'
    }
  },
  en: {
    resetPassword: {
      subject: 'Password Recovery - Recicloth',
      title: 'Recover Password',
      subtitle: "Don't worry, we'll help you!",
      greeting: 'Hello',
      message: 'We received a request to reset your password for your account at',
      shopName: 'Recicloth',
      buttonText: 'Reset Password',
      validFor: 'This link is valid for',
      minutes: '15 minutes',
      securityTip: 'Never share your password. If you did not request this recovery, ignore this email.',
      copyright: '© {year} Recicloth - All rights reserved'
    },
    passwordChanged: {
      subject: 'Password Changed - Recicloth',
      title: 'Password Reset!',
      subtitle: 'Your account is secure',
      greeting: 'Hello',
      message: 'Your password for',
      shopName: 'Recicloth',
      notYou: 'If you did not make this change, contact us immediately.',
      contactSupport: 'Support: recicloth@example.com',
      copyright: '© {year} Recicloth - All rights reserved'
    },
    orderConfirmation: {
      subject: 'Order Confirmation #{orderNumber} - Recicloth',
      title: 'Thank you for your order! 🎉',
      subtitle: 'We have received your order.',
      greeting: 'Hello',
      orderNumber: 'Order number',
      total: 'Total',
      items: 'Items',
      thankYou: 'Thank you for shopping at Recicloth!',
      copyright: '© {{year}} Recicloth - All rights reserved',
      shippingAddress: 'Shipping address',
      paymentMethod: 'Payment method',
      yourProducts: 'Your products',
      orderDate: 'Order date',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      vat: 'VAT (23%)',
      trackButton: 'Track order',
      disclaimer: 'This email is generated automatically. You can check your order status in your account at any time.'
    },
    orderShipped: {
      subject: 'Your order is on its way! #{{orderNumber}} - Recicloth',
      title: 'Order shipped!',
      subtitle: 'Your order is on its way',
      greeting: 'Hello',
      bodyText: 'Your order has left and is on its way. You can track the status in your account.',
      trackButton: 'Track order',
      shippingAddress: 'Shipping address',
      paymentMethod: 'Payment method',
      yourProducts: 'Your products',
      shipped: 'Shipped',
      orderDate: 'Order date',
      orderNumber: 'Order number',
      total: 'Total',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      vat: 'VAT (23%)',
      copyright: '© {{year}} Recicloth - All rights reserved',
      disclaimer: 'This email is sent automatically. You can check your order status in your account.'
    },
    emailVerification: {
      subject: 'Verify Email - Recicloth',
      title: 'Verify your Email',
      subtitle: 'Welcome to Recicloth!',
      greeting: 'Hello',
      message: 'To activate your account, please click the button below:',
      buttonText: 'Verify Email',
      validFor: 'This link is valid for 24 hours',
      copyright: '© {year} Recicloth - All rights reserved'
    }
  }
};

const paymentMethodLabel = (method?: string): string => {
  switch (method?.toLowerCase()) {
    case 'mbway': return 'MBWay';
    case 'multibanco': return 'Multibanco';
    case 'card':
    case 'stripe': return 'Cartão de Crédito';
    default: return method || '—';
  }
};

class EmailService {
  private resend: Resend | null;
  private from: string;
  private readonly emailEnabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.emailEnabled = Boolean(apiKey);
    this.resend = apiKey ? new Resend(apiKey) : null;
    const name = process.env.EMAIL_FROM_NAME || 'Recicloth';
    const address = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    this.from = `${name} <${address}>`;
    if (this.emailEnabled) {
      console.log('✅ Resend email service initialized — from:', this.from);
    } else {
      console.warn('⚠️ RESEND_API_KEY is missing. Email sending is disabled.');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName: string, language = 'pt') {
    if (!this.resend) {
      throw new Error('Email service not configured (RESEND_API_KEY missing).');
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/redefinir-senha?token=${resetToken}`;
    const t = emailTranslations[language] || emailTranslations.pt;
    const content = t.resetPassword;

    try {
      console.log('📧 Sending reset email to:', email);
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: content.subject,
        html: this.getResetPasswordHTML(resetUrl, userName, content),
        text: this.getResetPasswordText(resetUrl, userName, content)
      });
      if (error) throw new Error(error.message);
      console.log('✅ Reset email sent successfully!', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('❌ Error sending reset email:', error);
      throw new Error(`Could not send email: ${error.message}`);
    }
  }

  async sendPasswordChangedNotification(email: string, userName: string, language = 'pt') {
    if (!this.resend) {
      return { success: false, error: 'Email service not configured (RESEND_API_KEY missing).' };
    }

    const t = emailTranslations[language] || emailTranslations.pt;
    const content = t.passwordChanged;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: content.subject,
        html: this.getPasswordChangedHTML(userName, content),
        text: this.getPasswordChangedText(userName, content)
      });
      if (error) throw new Error(error.message);
      console.log('✅ Password changed notification sent:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('❌ Error sending notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendOrderConfirmation(
    email: string,
    userName: string,
    orderNumber: string,
    orderDetails: {
      total: number;
      subtotal?: number;
      shipping_cost?: number;
      vat_amount?: number;
      created_at?: string;
      customer_address?: string;
      customer_city?: string;
      customer_postal_code?: string;
      payment_method?: string;
      tracking_token?: string;
      items: Array<{ name: string; quantity: number; price: number; color?: string; size?: string; image?: string }>;
    },
    language = 'pt',
    invoicePdf?: Buffer
  ) {
    if (!this.resend) {
      return { success: false, error: 'Email service not configured (RESEND_API_KEY missing).' };
    }

    const t = emailTranslations[language] || emailTranslations.pt;
    const content = t.orderConfirmation;

    const sanitizedEmail = email.trim().toLowerCase();
    const subject = content.subject.replace('{orderNumber}', orderNumber);
    console.log(`📧 Order confirmation → to: "${sanitizedEmail}" | from: "${this.from}" | subject: "${subject}"`);

    const year = orderDetails.created_at
      ? new Date(orderDetails.created_at).getFullYear()
      : new Date().getFullYear();
    const invoiceFilename = `fatura-recicloth-${year}-${String(orderNumber).padStart(4, '0')}.pdf`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: sanitizedEmail,
        subject,
        html: this.getOrderConfirmationHTML(userName, orderNumber, orderDetails, content),
        text: this.getOrderConfirmationText(userName, orderNumber, orderDetails, content),
        ...(invoicePdf
          ? { attachments: [{ filename: invoiceFilename, content: invoicePdf }] }
          : {}),
      });
      if (error) throw new Error(error.message);
      console.log(`✅ Order confirmation sent to "${sanitizedEmail}":`, data?.id);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error(`❌ Error sending order confirmation to "${sanitizedEmail}":`, error.message);
      return { success: false, error: error.message };
    }
  }

  async sendEmailVerification(email: string, verificationToken: string, userName: string, language = 'pt') {
    if (!this.resend) {
      throw new Error('Email service not configured (RESEND_API_KEY missing).');
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verificar-email?token=${verificationToken}`;
    const t = emailTranslations[language] || emailTranslations.pt;
    const content = t.emailVerification;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: email,
        subject: content.subject,
        html: this.getEmailVerificationHTML(verificationUrl, userName, content),
        text: this.getEmailVerificationText(verificationUrl, userName, content)
      });
      if (error) throw new Error(error.message);
      console.log('✅ Verification email sent:', data?.id);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error('❌ Error sending verification email:', error.message);
      throw new Error(`Could not send email: ${error.message}`);
    }
  }

private getResetPasswordHTML(resetUrl: string, userName: string, content: any): string {
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fdfbf9 0%, #ffffff 50%, #fdfbf9 100%); min-height: 100vh;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px rgba(134, 75, 36, 0.08); overflow: hidden;">
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #864b24 0%, #6b3a1a 100%); border-radius: 20px; box-shadow: 0 8px 20px rgba(134, 75, 36, 0.25); margin-bottom: 24px; line-height: 80px;">
                <span style="font-size: 40px;">🔐</span>
              </div>
              <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: 700; color: #2d1a11;">${content.title}</h1>
              <p style="margin: 0; font-size: 15px; color: #8c8c8c;">${content.subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a3328;">
                ${content.greeting}${userName ? ` <strong>${userName}</strong>` : ''},
              </p>
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.7; color: #5f6368;">
                ${content.message} <strong>${content.shopName}</strong>.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #864b24 0%, #6b3a1a 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 12px rgba(134, 75, 36, 0.2);">
                      ${content.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background: #faf7f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #5f6368;">
                  <strong>⏱️ ${content.validFor} ${content.minutes}</strong>
                </p>
                <p style="margin: 0; font-size: 12px; color: #8c8c8c; word-break: break-all;">
                  ${resetUrl}
                </p>
              </div>
              <div style="background: #fff8f3; border-left: 4px solid #864b24; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #6b3a1a;">
                  🔒 ${content.securityTip}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #f0e9e4; text-align: center; background: #faf7f5;">
              <p style="margin: 0; font-size: 12px; color: #a3958e;">
                ${content.copyright.replace('{year}', new Date().getFullYear().toString())}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getResetPasswordText(resetUrl: string, userName: string, content: any): string {
    return `
${content.title}

${content.greeting}${userName ? ` ${userName}` : ''},

${content.message} ${content.shopName}.

${content.buttonText}: ${resetUrl}

${content.validFor} ${content.minutes}

${content.securityTip}

${content.copyright.replace('{year}', new Date().getFullYear().toString())}
    `;
  }

private getPasswordChangedHTML(userName: string, content: any): string {
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fdfbf9 0%, #ffffff 50%, #fdfbf9 100%); min-height: 100vh;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px rgba(134, 75, 36, 0.08); overflow: hidden;">
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #864b24 0%, #6b3a1a 100%); border-radius: 20px; box-shadow: 0 8px 20px rgba(134, 75, 36, 0.25); margin-bottom: 24px; line-height: 80px;">
                <span style="font-size: 40px; color: #ffffff;">✓</span>
              </div>
              <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: 700; color: #2d1a11;">${content.title}</h1>
              <p style="margin: 0; font-size: 15px; color: #8c8c8c;">${content.subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a3328;">
                ${content.greeting}${userName ? ` <strong>${userName}</strong>` : ''},
              </p>
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.7; color: #5f6368;">
                ${content.message} <strong>${content.shopName}</strong> foi alterada com sucesso.
              </p>
              <div style="background: #fff8f3; border-left: 4px solid #864b24; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #6b3a1a;">
                  ⚠️ ${content.notYou}
                </p>
              </div>
              <div style="background: #faf7f5; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 13px; color: #5f6368;">
                  ${content.contactSupport}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #f0e9e4; text-align: center; background: #faf7f5;">
              <p style="margin: 0; font-size: 12px; color: #a3958e;">
                ${content.copyright.replace('{year}', new Date().getFullYear().toString())}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getPasswordChangedText(userName: string, content: any): string {
    return `
${content.title}

${content.greeting}${userName ? ` ${userName}` : ''},

${content.message} ${content.shopName} foi alterada com sucesso.

${content.notYou}

${content.contactSupport}

${content.copyright.replace('{year}', new Date().getFullYear().toString())}
    `;
  }

private getOrderConfirmationHTML(
    userName: string,
    orderNumber: string,
    orderDetails: {
      total: number;
      subtotal?: number;
      shipping_cost?: number;
      vat_amount?: number;
      created_at?: string;
      customer_address?: string;
      customer_city?: string;
      customer_postal_code?: string;
      payment_method?: string;
      tracking_token?: string;
      items: Array<{ name: string; quantity: number; price: number; color?: string; size?: string; image?: string }>;
    },
    content: any
  ): string {
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
    const year = new Date().getFullYear().toString();
    const brand = '#1E4D3B';

    const formatDate = (raw?: string): string => {
      if (!raw) return '—';
      const d = new Date(raw);
      return isNaN(d.getTime()) ? raw : d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const addressParts = [
      orderDetails.customer_address,
      orderDetails.customer_postal_code,
      orderDetails.customer_city
    ].filter(Boolean);
    const addressLine = addressParts.length > 0 ? addressParts.join(', ') : '—';

    const subtotal = orderDetails.subtotal ?? orderDetails.total;
    const shippingCost = orderDetails.shipping_cost ?? 0;
    const vatAmount = orderDetails.vat_amount ?? 0;

    const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:3001';
    const itemsHTML = orderDetails.items.map((item) => {
      const price = parseFloat(String(item.price));
      const lineTotal = (price * item.quantity).toFixed(2);
      const meta = [item.color, item.size].filter(Boolean).join(' · ');
      const imgSrc = item.image
        ? (item.image.startsWith('http') ? item.image : `${backendUrl}${item.image.startsWith('/') ? '' : '/'}${item.image}`)
        : null;
      return `
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8f0ec; vertical-align: top;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
            ${imgSrc ? `<td style="padding-right: 12px; vertical-align: top;"><img src="${imgSrc}" alt="${item.name}" width="56" height="56" style="border-radius: 6px; object-fit: cover; display: block;" /></td>` : ''}
            <td style="vertical-align: top;">
              <div style="font-size: 14px; font-weight: 600; color: #1a2e25; margin-bottom: 2px;">${item.name}</div>
              ${meta ? `<div style="font-size: 12px; color: #6b7280;">${meta}</div>` : ''}
            </td>
          </tr></table>
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8f0ec; text-align: center; font-size: 14px; color: #374151; vertical-align: top; white-space: nowrap;">× ${item.quantity}</td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8f0ec; text-align: right; font-size: 14px; font-weight: 600; color: #1a2e25; vertical-align: top; white-space: nowrap;">${lineTotal}€</td>
      </tr>`;
    }).join('');

    const trackUrl = orderDetails.tracking_token
      ? `${frontendUrl}/track-order/${orderDetails.tracking_token}`
      : `${frontendUrl}/conta`;

    return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07);">

          <!-- Brand stripe -->
          <tr><td style="height: 12px; background-color: ${brand};"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding: 36px 40px 28px; text-align: center; background-color: #ffffff;">
              <img src="${frontendUrl}/images/logo.png" alt="Recicloth" width="140" style="display: block; margin: 0 auto 24px; max-width: 140px; height: auto;" />
              <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #1a2e25;">${content.title}</h1>
              <p style="margin: 0; font-size: 15px; color: #6b7280;">${content.subtitle}</p>
            </td>
          </tr>

          <!-- Order meta band -->
          <tr>
            <td style="padding: 16px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 13px; color: #6b7280;">${content.orderDate}: <strong style="color: #1a2e25;">${formatDate(orderDetails.created_at)}</strong></td>
                  <td style="font-size: 13px; color: #6b7280; text-align: right;">${content.orderNumber}: <strong style="color: #1a2e25;">#${orderNumber}</strong></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.7; color: #374151;">
                ${content.greeting} <strong>${userName}</strong>, obrigado pelo teu pedido na Recicloth! Já recebemos a tua encomenda e estamos a processá-la.
              </p>

              <!-- Shipping address -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">${content.shippingAddress}</p>
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${addressLine}</p>
              </div>

              <!-- Payment method -->
              <div style="margin-bottom: 28px;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">${content.paymentMethod}</p>
                <p style="margin: 0; font-size: 14px; color: #374151;">${paymentMethodLabel(orderDetails.payment_method)}</p>
              </div>

              <!-- Products -->
              <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">${content.yourProducts}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <tbody>${itemsHTML}</tbody>
              </table>

              <!-- Totals -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">${content.subtotal}</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #374151; text-align: right;">${parseFloat(String(subtotal)).toFixed(2)}€</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">${content.shipping}</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #374151; text-align: right;">${shippingCost > 0 ? `${parseFloat(String(shippingCost)).toFixed(2)}€` : 'Grátis'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">${content.vat}</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #374151; text-align: right;">${parseFloat(String(vatAmount)).toFixed(2)}€</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: ${brand}; border-top: 2px solid #e5e7eb;">${content.total}</td>
                  <td style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: ${brand}; text-align: right; border-top: 2px solid #e5e7eb;">${parseFloat(String(orderDetails.total)).toFixed(2)}€</td>
                </tr>
              </table>

              <!-- Track button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${trackUrl}" style="display: inline-block; background-color: ${brand}; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 8px;">${content.trackButton}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f8fafc; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">${content.disclaimer}</p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">${content.copyright.replace('{{year}}', year)}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getOrderConfirmationText(
    userName: string,
    orderNumber: string,
    orderDetails: {
      total: number;
      subtotal?: number;
      shipping_cost?: number;
      vat_amount?: number;
      created_at?: string;
      customer_address?: string;
      customer_city?: string;
      customer_postal_code?: string;
      payment_method?: string;
      tracking_token?: string;
      items: Array<{ name: string; quantity: number; price: number; color?: string; size?: string; image?: string }>;
    },
    content: any
  ): string {
    const year = new Date().getFullYear().toString();
    const itemsText = orderDetails.items.map((item) => {
      const meta = [item.color, item.size].filter(Boolean).join(', ');
      return `${item.name}${meta ? ` (${meta})` : ''} x${item.quantity} - ${parseFloat(String(item.price)).toFixed(2)}€`;
    }).join('\n');

    return `
${content.title}

${content.greeting} ${userName},

${content.orderNumber}: #${orderNumber}
${content.total}: ${parseFloat(String(orderDetails.total)).toFixed(2)}€

${content.yourProducts}:
${itemsText}

${content.thankYou}

${content.copyright.replace('{{year}}', year)}
    `;
  }

  async sendShippingConfirmation(
    email: string,
    userName: string,
    orderNumber: string,
    orderDetails: {
      total: number;
      shipping_cost?: number;
      created_at?: string;
      customer_address?: string;
      customer_city?: string;
      customer_postal_code?: string;
      payment_method?: string;
      tracking_token?: string;
      items: Array<{ name: string; quantity: number; price: number; color?: string; size?: string; image?: string }>;
    },
    language = 'pt'
  ) {
    if (!this.resend) {
      return { success: false, error: 'Email service not configured (RESEND_API_KEY missing).' };
    }

    const t = emailTranslations[language] || emailTranslations.pt;
    const content = t.orderShipped;

    const sanitizedEmail = email.trim().toLowerCase();
    const subject = content.subject.replace('{{orderNumber}}', orderNumber);
    console.log(`📧 Shipping confirmation → to: "${sanitizedEmail}" | subject: "${subject}"`);

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: sanitizedEmail,
        subject,
        html: this.getShippingConfirmationHTML(userName, orderNumber, orderDetails, content),
        text: this.getShippingConfirmationText(userName, orderNumber, orderDetails, content)
      });
      if (error) throw new Error(error.message);
      console.log(`✅ Shipping confirmation sent to "${sanitizedEmail}":`, data?.id);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error(`❌ Error sending shipping confirmation to "${sanitizedEmail}":`, error.message);
      return { success: false, error: error.message };
    }
  }

  private getShippingConfirmationHTML(
    userName: string,
    orderNumber: string,
    orderDetails: {
      total: number;
      shipping_cost?: number;
      created_at?: string;
      customer_address?: string;
      customer_city?: string;
      customer_postal_code?: string;
      payment_method?: string;
      tracking_token?: string;
      items: Array<{ name: string; quantity: number; price: number; color?: string; size?: string; image?: string }>;
    },
    content: any
  ): string {
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
    const year = new Date().getFullYear().toString();
    const brand = '#1E4D3B';
    const shippedBadgeColor = '#16a34a';

    const formatDate = (raw?: string): string => {
      if (!raw) return '—';
      const d = new Date(raw);
      return isNaN(d.getTime()) ? raw : d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const addressParts = [
      orderDetails.customer_address,
      orderDetails.customer_postal_code,
      orderDetails.customer_city
    ].filter(Boolean);
    const addressLine = addressParts.length > 0 ? addressParts.join(', ') : '—';

    const trackUrl = orderDetails.tracking_token
      ? `${frontendUrl}/track-order/${orderDetails.tracking_token}`
      : `${frontendUrl}/conta`;

    const itemsHTML = orderDetails.items.map((item) => {
      const price = parseFloat(String(item.price));
      const lineTotal = (price * item.quantity).toFixed(2);
      const meta = [item.color, item.size].filter(Boolean).join(' · ');
      const imgSrc = item.image ? `${frontendUrl}${item.image}` : null;
      return `
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8f0ec; vertical-align: top;">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            ${imgSrc ? `<img src="${imgSrc}" alt="${item.name}" width="56" height="56" style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;flex-shrink:0;" />` : ''}
            <div>
              <div style="font-size: 14px; font-weight: 600; color: #1a2e25; margin-bottom: 2px;">${item.name}</div>
              ${meta ? `<div style="font-size: 12px; color: #6b7280;">${meta}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8f0ec; text-align: center; font-size: 14px; color: #374151; vertical-align: top; white-space: nowrap;">× ${item.quantity}</td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8f0ec; text-align: right; font-size: 14px; font-weight: 600; color: #1a2e25; vertical-align: top; white-space: nowrap;">${lineTotal}€</td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #e8f0ec; text-align: right; vertical-align: top; white-space: nowrap;">
          <span style="display: inline-block; background-color: ${shippedBadgeColor}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.04em;">${content.shipped}</span>
        </td>
      </tr>`;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07);">

          <!-- Brand stripe -->
          <tr><td style="height: 12px; background-color: ${brand};"></td></tr>

          <!-- Header -->
          <tr>
            <td style="padding: 36px 40px 28px; text-align: center; background-color: #ffffff;">
              <img src="${frontendUrl}/images/logo.png" alt="Recicloth" width="140" style="display: block; margin: 0 auto 24px; max-width: 140px; height: auto;" />
              <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #1a2e25;">${content.title}</h1>
              <p style="margin: 0; font-size: 15px; color: #6b7280;">${content.subtitle}</p>
            </td>
          </tr>

          <!-- Prominent track button -->
          <tr>
            <td style="padding: 8px 40px 28px; text-align: center;">
              <a href="${trackUrl}" style="display: inline-block; background-color: ${brand}; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 48px; border-radius: 8px; letter-spacing: 0.02em;">${content.trackButton}</a>
            </td>
          </tr>

          <!-- Order meta band -->
          <tr>
            <td style="padding: 16px 40px; background-color: #f8fafc; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 13px; color: #6b7280;">${content.orderDate}: <strong style="color: #1a2e25;">${formatDate(orderDetails.created_at)}</strong></td>
                  <td style="font-size: 13px; color: #6b7280; text-align: right;">${content.orderNumber}: <strong style="color: #1a2e25;">#${orderNumber}</strong></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.7; color: #374151;">
                ${content.greeting} <strong>${userName}</strong>, ${content.bodyText}
              </p>

              <!-- Shipping address -->
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">${content.shippingAddress}</p>
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">${addressLine}</p>
              </div>

              <!-- Payment method -->
              <div style="margin-bottom: 28px;">
                <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">${content.paymentMethod}</p>
                <p style="margin: 0; font-size: 14px; color: #374151;">${paymentMethodLabel(orderDetails.payment_method)}</p>
              </div>

              <!-- Products -->
              <p style="margin: 0 0 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">${content.yourProducts}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                <tbody>${itemsHTML}</tbody>
              </table>

              <!-- Totals -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
                ${orderDetails.shipping_cost != null && orderDetails.shipping_cost > 0 ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb;">${content.shipping}</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #6b7280; text-align: right; border-top: 1px solid #e5e7eb;">${parseFloat(String(orderDetails.shipping_cost)).toFixed(2)}€</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: ${brand}; border-top: 2px solid #e5e7eb;">${content.total}</td>
                  <td style="padding: 12px 0 0; font-size: 16px; font-weight: 700; color: ${brand}; text-align: right; border-top: 2px solid #e5e7eb;">${parseFloat(String(orderDetails.total)).toFixed(2)}€</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f8fafc; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">${content.disclaimer}</p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">${content.copyright.replace('{{year}}', year)}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getShippingConfirmationText(
    userName: string,
    orderNumber: string,
    orderDetails: {
      total: number;
      shipping_cost?: number;
      created_at?: string;
      customer_address?: string;
      customer_city?: string;
      customer_postal_code?: string;
      payment_method?: string;
      tracking_token?: string;
      items: Array<{ name: string; quantity: number; price: number; color?: string; size?: string; image?: string }>;
    },
    content: any
  ): string {
    const year = new Date().getFullYear().toString();
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
    const trackUrl = orderDetails.tracking_token
      ? `${frontendUrl}/track-order/${orderDetails.tracking_token}`
      : `${frontendUrl}/conta`;

    const itemsText = orderDetails.items.map((item) => {
      const meta = [item.color, item.size].filter(Boolean).join(', ');
      return `${item.name}${meta ? ` (${meta})` : ''} x${item.quantity} - ${parseFloat(String(item.price)).toFixed(2)}€`;
    }).join('\n');

    return `
${content.title}

${content.greeting} ${userName}, ${content.bodyText}

${content.orderNumber}: #${orderNumber}
${content.total}: ${parseFloat(String(orderDetails.total)).toFixed(2)}€

${content.yourProducts}:
${itemsText}

${content.trackButton}: ${trackUrl}

${content.copyright.replace('{{year}}', year)}
    `;
  }

private getEmailVerificationHTML(verificationUrl: string, userName: string, content: any): string {
    return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fdfbf9 0%, #ffffff 50%, #fdfbf9 100%); min-height: 100vh;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; box-shadow: 0 10px 40px rgba(134, 75, 36, 0.08); overflow: hidden;">
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center;">
              <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #864b24 0%, #6b3a1a 100%); border-radius: 20px; box-shadow: 0 8px 20px rgba(134, 75, 36, 0.25); margin-bottom: 24px; line-height: 80px;">
                <span style="font-size: 40px;">📧</span>
              </div>
              <h1 style="margin: 0 0 12px; font-size: 28px; font-weight: 700; color: #2d1a11;">${content.title}</h1>
              <p style="margin: 0; font-size: 15px; color: #8c8c8c;">${content.subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a3328;">
                ${content.greeting}${userName ? ` <strong>${userName}</strong>` : ''},
              </p>
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.7; color: #5f6368;">
                ${content.message}
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #864b24 0%, #6b3a1a 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 12px rgba(134, 75, 36, 0.2);">
                      ${content.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background: #faf7f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #5f6368;">
                  <strong>⏱️ ${content.validFor}</strong>
                </p>
                <p style="margin: 0; font-size: 12px; color: #8c8c8c; word-break: break-all;">
                  ${verificationUrl}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #f0e9e4; text-align: center; background: #faf7f5;">
              <p style="margin: 0; font-size: 12px; color: #a3958e;">
                ${content.copyright.replace('{year}', new Date().getFullYear().toString())}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  async sendContactMessage({ name, email, subject, message }: { name: string; email: string; subject: string; message: string }) {
    const year = new Date().getFullYear();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#1E4D3B;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Recicloth</h1>
          <p style="margin:4px 0 0;color:#a7d4be;font-size:13px;">Nova mensagem de contacto</p>
        </td></tr>
        <tr><td style="padding:32px 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin-bottom:24px;">
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Nome</span><br>
                <span style="font-size:15px;color:#1a1a1a;font-weight:600;">${name}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Email</span><br>
                <a href="mailto:${email}" style="font-size:15px;color:#1E4D3B;text-decoration:none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 16px;">
                <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Assunto</span><br>
                <span style="font-size:15px;color:#1a1a1a;">${subject}</span>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Mensagem</p>
          <div style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;padding:16px;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message}</div>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">© ${year} Recicloth — Todos os direitos reservados</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await this.resend.emails.send({
      from: this.from,
      to: 'general@recicloth.com',
      replyTo: email,
      subject: `[Contacto] ${subject} — ${name}`,
      html,
    });
  }

  async sendGuestOtp(email: string, code: string) {
    const year = new Date().getFullYear();
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#1E4D3B;padding:28px 40px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Recicloth</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 8px;font-size:24px;color:#1a1a1a;">Verificação de email</h2>
          <p style="margin:0 0 32px;color:#666;font-size:15px;">Use o código abaixo para confirmar o seu email e concluir a encomenda.</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:28px;text-align:center;margin-bottom:28px;">
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Código de verificação</p>
            <p style="margin:0;font-size:42px;font-weight:800;letter-spacing:10px;color:#1E4D3B;font-family:monospace;">${code}</p>
            <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">Válido por 10 minutos</p>
          </div>
          <p style="margin:0;font-size:13px;color:#9ca3af;">Se não fez esta encomenda, ignore este email.</p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">© ${year} Recicloth — Todos os direitos reservados</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: `${code} — Código de verificação Recicloth`,
      html,
    });
  }

  private getEmailVerificationText(verificationUrl: string, userName: string, content: any): string {
    return `
${content.title}

${content.greeting}${userName ? ` ${userName}` : ''},

${content.message}

${content.buttonText}: ${verificationUrl}

${content.validFor}

${content.copyright.replace('{year}', new Date().getFullYear().toString())}
    `;
  }
}

export default new EmailService();
