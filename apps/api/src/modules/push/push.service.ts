import * as webpush from 'web-push';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env.validation';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get('VAPID_PUBLIC_KEY', { infer: true });
    const privateKey = this.config.get('VAPID_PRIVATE_KEY', { infer: true });
    if (publicKey && privateKey) {
      webpush.setVapidDetails(
        this.config.get('VAPID_MAILTO', { infer: true }),
        publicKey,
        privateKey,
      );
      this.enabled = true;
    }
  }

  getPublicKey(): string {
    return this.config.get('VAPID_PUBLIC_KEY', { infer: true }) ?? '';
  }

  async subscribe(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
  ): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth },
      update: { userId, p256dh, auth },
    });
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  async sendToUser(
    userId: string,
    payload: { title: string; body: string; url?: string },
  ): Promise<void> {
    if (!this.enabled) return;
    const subs = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });
    await Promise.all(
      subs.map((s) =>
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
          )
          .catch(async (err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await this.prisma.pushSubscription
                .deleteMany({ where: { endpoint: s.endpoint } })
                .catch(() => {});
            } else {
              this.logger.warn(`Push xatosi: ${err.message}`);
            }
          }),
      ),
    );
  }
}
