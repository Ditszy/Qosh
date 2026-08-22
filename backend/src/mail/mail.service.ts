import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

type ResetPasswordMail = {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
  }

  async sendPasswordResetMail(payload: ResetPasswordMail): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`Password reset link for ${payload.to}: ${payload.resetUrl}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get<string>('MAIL_FROM', 'Qosh <no-reply@qosh.local>'),
      to: payload.to,
      subject: 'Qosh password reset',
      text: [
        `Hi ${payload.firstName},`,
        '',
        `Use this link to reset your Qosh password. It expires in ${payload.expiresInMinutes} minutes:`,
        payload.resetUrl,
        '',
        'If you did not request this, ignore this email.',
      ].join('\n'),
    });
  }

  private createTransporter(): Transporter | null {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT'));
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    if (!host || !port || !user || !pass) {
      this.logger.log('SMTP is not configured. Password reset links will be logged.');
      return null;
    }

    return createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }
}
