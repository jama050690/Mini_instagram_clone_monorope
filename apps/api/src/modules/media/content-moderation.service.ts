import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../../common/errors/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { Env } from '../../config/env.validation';

const LIKELIHOOD: Record<string, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5,
};

const VISION_URL =
  'https://vision.googleapis.com/v1/images:annotate';

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.apiKey = this.config.get('GOOGLE_CLOUD_VISION_KEY', { infer: true });
  }

  async checkImage(buffer: Buffer): Promise<void> {
    if (!this.apiKey) return;

    let annotation: Record<string, string> | undefined;
    try {
      const res = await fetch(`${VISION_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: buffer.toString('base64') },
              features: [{ type: 'SAFE_SEARCH_DETECTION' }],
            },
          ],
        }),
      });

      const data = (await res.json()) as {
        responses?: { safeSearchAnnotation?: Record<string, string> }[];
      };
      annotation = data.responses?.[0]?.safeSearchAnnotation;
    } catch (err) {
      this.logger.warn('Vision API muloqotida xato, o\'tkazib yuborildi', err);
      return;
    }

    if (!annotation) return;

    const score = (key: string) => LIKELIHOOD[annotation![key] ?? 'UNKNOWN'] ?? 0;

    // adult, violence, racy kategoriyalaridan biri LIKELY yoki yuqori bo'lsa rad etiladi
    if (score('adult') >= 4 || score('violence') >= 4 || score('racy') >= 4) {
      throw new AppException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.CONTENT_POLICY_VIOLATION,
        'Kontent siyosatimizga zid: axloqsiz, zo\'rovonlik yoki nomaqbul material aniqlandi',
      );
    }
  }
}
