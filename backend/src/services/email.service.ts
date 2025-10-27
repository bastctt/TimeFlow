import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

class EmailService {
  private transporter: Transporter;
  private fromEmail: string;
  private appUrl: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@timeflow.com';
    this.appUrl = process.env.APP_URL || 'http://localhost';

    // Configure MailHog SMTP (no authentication needed)
    const smtpHost = process.env.SMTP_HOST || 'mailhog';
    const smtpPort = parseInt(process.env.SMTP_PORT || '1025');

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // MailHog doesn't use TLS
      ignoreTLS: true,
      auth: false as any, // Disable authentication for MailHog
    });

    console.log(`📧 Email service configured:`);
    console.log(`   SMTP: ${smtpHost}:${smtpPort}`);
    console.log(`   From: ${this.fromEmail}`);
    console.log(`   Web UI: http://localhost:8025`);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"TimeFlow" <${this.fromEmail}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe - TimeFlow',
      html: this.getPasswordResetTemplate(firstName, resetUrl),
      text: `Bonjour ${firstName},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur le lien suivant pour définir un nouveau mot de passe :\n${resetUrl}\n\nCe lien est valide pendant 24 heures.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\nCordialement,\nL'équipe TimeFlow`,
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${to}`);
    console.log(`📧 View email at: http://localhost:8025`);
  }

  /**
   * Send welcome email to new user with password setup link
   */
  async sendWelcomeEmail(
    to: string,
    firstName: string,
    lastName: string,
    resetToken: string
  ): Promise<void> {
    const setupUrl = `${this.appUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"TimeFlow" <${this.fromEmail}>`,
      to,
      subject: 'Bienvenue sur TimeFlow - Configurez votre mot de passe',
      html: this.getWelcomeEmailTemplate(firstName, lastName, setupUrl),
      text: `Bonjour ${firstName} ${lastName},\n\nBienvenue sur TimeFlow !\n\nVotre compte a été créé. Pour commencer à utiliser l'application, vous devez définir votre mot de passe.\n\nCliquez sur le lien suivant pour configurer votre mot de passe :\n${setupUrl}\n\nCe lien est valide pendant 24 heures.\n\nCordialement,\nL'équipe TimeFlow`,
    };

    const info = await this.transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${to}`);
    console.log(`📧 View email at: http://localhost:8025`);
  }

  /**
   * HTML template for password reset email
   */
  private getPasswordResetTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe - TimeFlow</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header with Logo -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: 60px; height: 60px; margin-bottom: 16px;">
                      <rect width="100" height="100" fill="white" />
                      <line x1="20" y1="80" x2="80" y2="20" stroke="black" stroke-width="10" stroke-linecap="round"/>
                      <line x1="20" y1="60" x2="60" y2="20" stroke="black" stroke-width="10" stroke-linecap="round"/>
                      <line x1="50" y1="70" x2="75" y2="45" stroke="black" stroke-width="10" stroke-linecap="round"/>
                    </svg>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.02em;">TimeFlow</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Gérez votre temps efficacement</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #111827;">Réinitialisation de mot de passe</h2>

                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                      Bonjour <strong>${firstName}</strong>,
                    </p>

                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :
                    </p>

                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0 24px 0;">
                          <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: 0.01em;">
                            Réinitialiser mon mot de passe
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      Ce lien est valide pendant <strong>24 heures</strong>.
                    </p>

                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
                    </p>

                    <!-- Divider -->
                    <div style="border-top: 1px solid #e5e7eb; margin: 32px 0;"></div>

                    <!-- Fallback URL -->
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                      Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280; word-break: break-all;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                      © 2025 TimeFlow. Tous droits réservés.
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

  /**
   * HTML template for welcome email
   */
  private getWelcomeEmailTemplate(
    firstName: string,
    lastName: string,
    setupUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur TimeFlow</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header with Logo -->
                <tr>
                  <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: 60px; height: 60px; margin-bottom: 16px;">
                      <rect width="100" height="100" fill="white" />
                      <line x1="20" y1="80" x2="80" y2="20" stroke="black" stroke-width="10" stroke-linecap="round"/>
                      <line x1="20" y1="60" x2="60" y2="20" stroke="black" stroke-width="10" stroke-linecap="round"/>
                      <line x1="50" y1="70" x2="75" y2="45" stroke="black" stroke-width="10" stroke-linecap="round"/>
                    </svg>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.02em;">TimeFlow</h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">Gérez votre temps efficacement</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: #111827;">Bienvenue sur TimeFlow !</h2>

                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                      Bonjour <strong>${firstName} ${lastName}</strong>,
                    </p>

                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #374151;">
                      Votre compte TimeFlow a été créé avec succès ! Pour commencer à utiliser l'application, vous devez configurer votre mot de passe.
                    </p>

                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0 24px 0;">
                          <a href="${setupUrl}" style="display: inline-block; padding: 12px 32px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: 0.01em;">
                            Définir mon mot de passe
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                      Ce lien est valide pendant <strong>24 heures</strong>.
                    </p>

                    <!-- Features List -->
                    <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 24px 0;">
                      <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #111827;">
                        Une fois votre mot de passe configuré, vous pourrez :
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; color: #374151;">
                            ✓ Pointer vos heures de travail
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; color: #374151;">
                            ✓ Consulter vos statistiques
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; color: #374151;">
                            ✓ Gérer vos absences
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; font-size: 14px; color: #374151;">
                            ✓ Collaborer avec votre équipe
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Divider -->
                    <div style="border-top: 1px solid #e5e7eb; margin: 32px 0;"></div>

                    <!-- Fallback URL -->
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                      Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #6b7280; word-break: break-all;">
                      ${setupUrl}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; text-align: center;">
                      © 2025 TimeFlow. Tous droits réservés.
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

  /**
   * Verify email configuration (useful for testing)
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
