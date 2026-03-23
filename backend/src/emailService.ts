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
      title: 'Pedido Confirmado!',
      subtitle: 'Obrigado pela sua compra',
      greeting: 'Olá',
      orderNumber: 'Pedido',
      total: 'Total',
      items: 'Artigos',
      thankYou: 'Obrigado por comprar na Recicloth!',
      copyright: '© {year} Recicloth - Todos os direitos reservados'
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
      title: 'Order Confirmed!',
      subtitle: 'Thank you for your purchase',
      greeting: 'Hello',
      orderNumber: 'Order',
      total: 'Total',
      items: 'Items',
      thankYou: 'Thank you for shopping at Recicloth!',
      copyright: '© {year} Recicloth - All rights reserved'
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

class EmailService {
  private resend: Resend;
  private from: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    const name = process.env.EMAIL_FROM_NAME || 'Recicloth';
    const address = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    this.from = `${name} <${address}>`;
    console.log('✅ Resend email service initialized — from:', this.from);
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName: string, language = 'pt') {
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
    orderDetails: any,
    language = 'pt'
  ) {
    const t = emailTranslations[language] || emailTranslations.pt;
    const content = t.orderConfirmation;

    const sanitizedEmail = email.trim().toLowerCase();
    const subject = content.subject.replace('{orderNumber}', orderNumber);
    console.log(`📧 Order confirmation → to: "${sanitizedEmail}" | from: "${this.from}" | subject: "${subject}"`);

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: sanitizedEmail,
        subject,
        html: this.getOrderConfirmationHTML(userName, orderNumber, orderDetails, content),
        text: this.getOrderConfirmationText(userName, orderNumber, orderDetails, content)
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

private getOrderConfirmationHTML(userName: string, orderNumber: string, orderDetails: any, content: any): string {
    const itemsHTML = orderDetails.items.map((item: any) => {
      const price = parseFloat(String(item.price));
      const lineTotal = (price * item.quantity).toFixed(2);
      return `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0e9e4;">${item.name}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0e9e4; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #f0e9e4; text-align: right; font-weight: 500;">${price.toFixed(2)}€</td>
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fcfaf8; min-height: 100vh;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(134, 75, 36, 0.06); overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px 24px; text-align: center;">
              
              <img src="images/logo-mail.png" alt="${content.shopName}" width="100" style="display: block; margin: 0 auto 24px auto; max-width: 120px; height: auto;" />
              
              <h1 style="margin: 0 0 8px; font-size: 26px; font-weight: 700; color: #2d1a11;">${content.title}</h1>
              <p style="margin: 0; font-size: 15px; color: #8c8c8c;">${content.subtitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a3328;">
                ${content.greeting}${userName ? ` <strong>${userName}</strong>` : ''},
              </p>
              
              <div style="background: #faf7f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding-bottom: 8px; font-size: 14px; color: #6b3a1a;">
                      <strong>${content.orderNumber}:</strong> <span style="color: #4a3328;">#${orderNumber}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #6b3a1a;">
                      <strong>${content.total}:</strong> <span style="color: #4a3328;">${parseFloat(String(orderDetails.total)).toFixed(2)}€</span>
                    </td>
                  </tr>
                </table>
              </div>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="padding: 12px 8px; text-align: left; font-size: 13px; color: #8c8c8c; border-bottom: 2px solid #f0e9e4; font-weight: 600;">Artigo</th>
                    <th style="padding: 12px 8px; text-align: center; font-size: 13px; color: #8c8c8c; border-bottom: 2px solid #f0e9e4; font-weight: 600;">Qtd</th>
                    <th style="padding: 12px 8px; text-align: right; font-size: 13px; color: #8c8c8c; border-bottom: 2px solid #f0e9e4; font-weight: 600;">Preço</th>
                  </tr>
                </thead>
                <tbody style="color: #4a3328; font-size: 14px;">
                  ${itemsHTML}
                </tbody>
              </table>

              <p style="margin: 0; font-size: 15px; text-align: center; color: #6b3a1a; font-weight: 500;">
                ${content.thankYou}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 30px; border-top: 1px solid #f0e9e4; text-align: center; background: #faf7f5;">
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

  private getOrderConfirmationText(userName: string, orderNumber: string, orderDetails: any, content: any): string {
    const itemsText = orderDetails.items.map((item: any) =>
      `${item.name} x${item.quantity} - ${parseFloat(String(item.price)).toFixed(2)}€`
    ).join('\n');

    return `
${content.title}

${content.greeting}${userName ? ` ${userName}` : ''},

${content.orderNumber}: #${orderNumber}
${content.total}: ${parseFloat(String(orderDetails.total)).toFixed(2)}€

${content.items}:
${itemsText}

${content.thankYou}

${content.copyright.replace('{year}', new Date().getFullYear().toString())}
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
