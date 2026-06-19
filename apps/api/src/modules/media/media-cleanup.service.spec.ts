import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Env } from '../../config/env.validation';
import { MediaCleanupService } from './media-cleanup.service';
import { MediaService } from './media.service';

describe('MediaCleanupService.sweepOrphans', () => {
  const base = path.resolve('test/.tmp-uploads-cleanup');
  const config = { get: () => base } as unknown as ConfigService<Env, true>;

  // Faqat 'live' postId uchun yozuv bor deb hisoblaymiz.
  const prisma = {
    post: {
      findUnique: ({ where: { id } }: { where: { id: string } }) =>
        Promise.resolve(id === 'live' ? { id } : null),
    },
  } as never;

  const media = new MediaService(config, prisma, {} as never);
  const service = new MediaCleanupService(config, media, prisma);

  afterAll(async () => {
    await fs.rm(base, { recursive: true, force: true });
  });

  it("DB'da posti yo'q papkalarni o'chiradi, mavjudini saqlaydi", async () => {
    const postsDir = path.join(base, 'posts');
    await fs.mkdir(path.join(postsDir, 'live'), { recursive: true });
    await fs.mkdir(path.join(postsDir, 'orphan'), { recursive: true });
    await fs.writeFile(
      path.join(postsDir, 'orphan', 'x.jpg'),
      Buffer.from([1]),
    );

    const removed = await service.sweepOrphans();

    expect(removed).toBe(1);
    await expect(
      fs.access(path.join(postsDir, 'live')),
    ).resolves.toBeUndefined();
    await expect(fs.access(path.join(postsDir, 'orphan'))).rejects.toThrow();
  });

  it("posts papkasi yo'q bo'lsa xato bermaydi", async () => {
    await fs.rm(path.join(base, 'posts'), { recursive: true, force: true });
    await expect(service.sweepOrphans()).resolves.toBe(0);
  });
});
