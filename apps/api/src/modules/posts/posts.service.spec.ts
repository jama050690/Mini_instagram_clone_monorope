import { User } from '@prisma/client';
import { AppException } from '../../common/exceptions/app.exception';
import { MediaService } from '../media/media.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VisibilityService } from '../visibility/visibility.service';
import { PostsService } from './posts.service';

/** Minimal multer fayl (faqat create() uchun kerakli maydonlar). */
function fakeFile(): Express.Multer.File {
  return { size: 10, buffer: Buffer.from([1, 2, 3]) } as Express.Multer.File;
}

const AUTHOR = { id: 'u1' } as User;

describe('PostsService.create (orkestratsiya)', () => {
  let media: jest.Mocked<
    Pick<
      MediaService,
      | 'validatePostMedia'
      | 'mimeFor'
      | 'process'
      | 'storePostMedia'
      | 'deletePostDir'
    >
  >;

  beforeEach(() => {
    media = {
      validatePostMedia: jest.fn(),
      mimeFor: jest.fn().mockReturnValue('image/jpeg'),
      process: jest.fn((b: Buffer) => b),
      storePostMedia: jest.fn().mockResolvedValue('posts/p1/m.jpg'),
      deletePostDir: jest.fn().mockResolvedValue(undefined),
    };
  });

  function makeService(prisma: Partial<PrismaService>): PostsService {
    return new PostsService(
      prisma as PrismaService,
      media as unknown as MediaService,
      {} as VisibilityService,
    );
  }

  it('fayl yo`q → INVALID_MEDIA_COUNT, DB ga tegmaydi', async () => {
    const $transaction = jest.fn();
    const service = makeService({ $transaction });

    await expect(service.create(AUTHOR, undefined, [])).rejects.toMatchObject({
      code: 'INVALID_MEDIA_COUNT',
    });
    expect($transaction).not.toHaveBeenCalled();
  });

  it('rasm + video aralash → MIXED_MEDIA, tranzaksiya ochilmaydi', async () => {
    media.validatePostMedia
      .mockReturnValueOnce({ kind: 'IMAGE', ext: 'jpg' })
      .mockReturnValueOnce({ kind: 'VIDEO', ext: 'mp4' });
    const $transaction = jest.fn();
    const service = makeService({ $transaction });

    await expect(
      service.create(AUTHOR, undefined, [fakeFile(), fakeFile()]),
    ).rejects.toBeInstanceOf(AppException);
    expect($transaction).not.toHaveBeenCalled();
  });

  it('tranzaksiya xatosi → yozilgan fayllar papkasi o`chiriladi (rollback)', async () => {
    media.validatePostMedia.mockReturnValue({ kind: 'IMAGE', ext: 'jpg' });

    // $transaction callback'ini chaqiramiz: post yaratiladi, 2-media create yiqiladi.
    const tx = {
      post: { create: jest.fn().mockResolvedValue({ id: 'p1' }) },
      media: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 'm1' })
          .mockRejectedValueOnce(new Error('DB down')),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const $transaction = jest.fn((cb: (t: typeof tx) => unknown) => cb(tx));
    const service = makeService({ $transaction } as unknown as PrismaService);

    await expect(
      service.create(AUTHOR, 'cap', [fakeFile(), fakeFile()]),
    ).rejects.toThrow('DB down');

    expect(media.deletePostDir).toHaveBeenCalledWith('p1');
  });
});
