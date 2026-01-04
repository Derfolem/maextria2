import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'MAEXTRIA <noreply@maextria.com>',
    to: email,
    subject: 'Confirme seu email - MAEXTRIA',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bem-vindo à MAEXTRIA!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Obrigado por se cadastrar na MAEXTRIA, sua plataforma de cursos online!</p>
              <p>Para ativar sua conta e começar a aprender, por favor confirme seu endereço de email clicando no botão abaixo:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Confirmar Email</a>
              </div>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p>Se você não se cadastrou na MAEXTRIA, por favor ignore este email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MAEXTRIA. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.warn('Skipping verification email: EMAIL_USER/EMAIL_PASS not configured.');
      return;
    }

    await mailer.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'MAEXTRIA <noreply@maextria.com>',
    to: email,
    subject: 'Redefinir sua senha - MAEXTRIA',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Redefinir Senha</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Recebemos uma solicitação para redefinir a senha da sua conta MAEXTRIA.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>
              <p>Este link expira em 1 hora.</p>
              <p>Se você não solicitou a redefinição de senha, por favor ignore este email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MAEXTRIA. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.warn('Skipping password reset email: EMAIL_USER/EMAIL_PASS not configured.');
      return;
    }

    await mailer.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
}

export async function sendCertificateEmail(
  email: string,
  name: string,
  courseName: string,
  certificateId: string
): Promise<void> {
  const certificateUrl = `${FRONTEND_URL}/certificate/${certificateId}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'MAEXTRIA <noreply@maextria.com>',
    to: email,
    subject: `Seu Certificado do curso "${courseName}" - MAEXTRIA`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Parabéns!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${name}</strong>,</p>
              <p>Seu certificado do curso <strong>"${courseName}"</strong> está disponível!</p>
              <p>Clique no botão abaixo para visualizar e fazer o download:</p>
              <div style="text-align: center;">
                <a href="${certificateUrl}" class="button">Ver Certificado</a>
              </div>
              <p>Parabéns por concluir o curso! Continue aprendendo com a MAEXTRIA.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MAEXTRIA. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const mailer = getTransporter();
    if (!mailer) {
      console.warn('Skipping certificate email: EMAIL_USER/EMAIL_PASS not configured.');
      return;
    }

    await mailer.sendMail(mailOptions);
    console.log(`Certificate email sent to ${email}`);
  } catch (error) {
    console.error('Error sending certificate email:', error);
  }
}
