import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/exceptions/app.exception';
import { Env } from '../../config/env.validation';
import { MediaService } from './media.service';

/** Berilgan magic-byte prefiks bilan soxta image buffer yasaydi. */
function fileWith(prefix: number[], sizeBytes = 1024): Express.Multer.File {
  const buf = Buffer.alloc(sizeBytes);
  Buffer.from(prefix).copy(buf, 0);
  return {
    buffer: buf,
    size: buf.length,
    originalname: 'x.bin',
    mimetype: 'application/octet-stream',
  } as Express.Multer.File;
}

const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// "RIFF" .... "WEBP"
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

describe('MediaService.validateImage', () => {
  const service = new MediaService(
    { get: () => 'uploads' } as unknown as ConfigService<Env, true>,
    {} as never,
    {} as never,
  );

  const MAX = 2 * 1024 * 1024;

  it('jpg/png/webp magic-byte ni qabul qiladi va kengaytmani qaytaradi', () => {
    expect(service.validateImage(fileWith(JPEG), MAX)).toBe('jpg');
    expect(service.validateImage(fileWith(PNG), MAX)).toBe('png');
    expect(service.validateImage(fileWith(WEBP), MAX)).toBe('webp');
  });

  it("noto'g'ri magic-byte → INVALID_FILE_TYPE", () => {
    expect(() =>
      service.validateImage(fileWith([0x25, 0x50, 0x44, 0x46]), MAX),
    ).toThrow(AppException);
    try {
      service.validateImage(fileWith([0x25, 0x50, 0x44, 0x46]), MAX);
    } catch (e) {
      expect((e as AppException).code).toBe('INVALID_FILE_TYPE');
    }
  });

  it('hajmi limitdan oshsa → FILE_TOO_LARGE', () => {
    const big = fileWith(JPEG, MAX + 1);
    try {
      service.validateImage(big, MAX);
      fail('xato kutilgan edi');
    } catch (e) {
      expect((e as AppException).code).toBe('FILE_TOO_LARGE');
    }
  });
});

// mp4: offset 4-8 = "ftyp", brand "isom"; mov: brand "qt  "; webm: EBML 1A45DFA3
const MP4 = [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d];
const MOV = [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74, 0x20, 0x20];
const WEBM = [0x1a, 0x45, 0xdf, 0xa3];

describe('MediaService.validatePostMedia', () => {
  const service = new MediaService(
    { get: () => 'uploads' } as unknown as ConfigService<Env, true>,
    {} as never,
    {} as never,
  );

  it('rasm → IMAGE kind + ext', () => {
    expect(service.validatePostMedia(fileWith(JPEG))).toEqual({
      kind: 'IMAGE',
      ext: 'jpg',
    });
    expect(service.validatePostMedia(fileWith(WEBP))).toEqual({
      kind: 'IMAGE',
      ext: 'webp',
    });
  });

  it('video (mp4/webm/mov) → VIDEO kind + ext', () => {
    expect(service.validatePostMedia(fileWith(MP4))).toEqual({
      kind: 'VIDEO',
      ext: 'mp4',
    });
    expect(service.validatePostMedia(fileWith(WEBM))).toEqual({
      kind: 'VIDEO',
      ext: 'webm',
    });
    expect(service.validatePostMedia(fileWith(MOV))).toEqual({
      kind: 'VIDEO',
      ext: 'mov',
    });
  });

  it('rasm 5MB dan oshsa → FILE_TOO_LARGE', () => {
    const big = fileWith(JPEG, 5 * 1024 * 1024 + 1);
    try {
      service.validatePostMedia(big);
      fail('xato kutilgan edi');
    } catch (e) {
      expect((e as AppException).code).toBe('FILE_TOO_LARGE');
    }
  });

  it('video 20MB dan oshsa → FILE_TOO_LARGE', () => {
    const big = fileWith(MP4, 20 * 1024 * 1024 + 1);
    try {
      service.validatePostMedia(big);
      fail('xato kutilgan edi');
    } catch (e) {
      expect((e as AppException).code).toBe('FILE_TOO_LARGE');
    }
  });

  it("noma'lum format → INVALID_FILE_TYPE", () => {
    try {
      service.validatePostMedia(fileWith([0x25, 0x50, 0x44, 0x46]));
      fail('xato kutilgan edi');
    } catch (e) {
      expect((e as AppException).code).toBe('INVALID_FILE_TYPE');
    }
  });
});
