import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('MAIL_FROM', 'VocabMaster <no-reply@vocabmaster.app>');

    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      // Chua cau hinh SMTP (vi du moi setup Codespaces lan dau) - thay vi
      // throw loi lam sap ca luong doi mat khau, fallback ve log ra console
      // de van dev/test duoc binh thuong. Xem sendMail() ben duoi.
      this.logger.warn(
        'SMTP_HOST is not set — emails will be logged to the console instead of actually sent. ' +
          'Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD in .env to send real emails.',
      );
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('SMTP_PORT', 587),
      // true chi danh cho port 465 (SSL truc tiep); port 587/25 dung STARTTLS
      // (secure: false, nodemailer tu nang cap ket noi).
      secure: this.config.get<number>('SMTP_PORT', 587) === 465,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  private async sendMail(to: string, subject: string, html: string, text: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[DEV MAIL] To: ${to} | Subject: ${subject}\n${text}`);
      return;
    }

    await this.transporter.sendMail({ from: this.from, to, subject, html, text });
  }

  async sendPasswordResetEmail(to: string, username: string, resetLink: string): Promise<void> {
    const subject = 'Reset your VocabMaster password';
    const text =
      `Hi ${username},\n\n` +
      `We received a request to reset your VocabMaster password. Click the link below to choose a new one:\n\n${resetLink}\n\n` +
      `This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.`;
    const html = `
      <p>Hi ${username},</p>
      <p>We received a request to reset your VocabMaster password. Click the button below to choose a new one:</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#f59e0b;color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a></p>
      <p>Or copy this link into your browser:<br>${resetLink}</p>
      <p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
    `;
    await this.sendMail(to, subject, html, text);
  }

  async sendPasswordChangedEmail(to: string, username: string): Promise<void> {
    const subject = 'Your VocabMaster password was changed';
    const text =
      `Hi ${username},\n\n` +
      `Your password was just changed. If this was you, no action is needed.\n` +
      `If you didn't make this change, please reset your password immediately and contact support.`;
    const html = `
      <p>Hi ${username},</p>
      <p>Your password was just changed. If this was you, no action is needed.</p>
      <p>If you didn't make this change, please reset your password immediately and contact support.</p>
    `;
    await this.sendMail(to, subject, html, text);
  }
}
