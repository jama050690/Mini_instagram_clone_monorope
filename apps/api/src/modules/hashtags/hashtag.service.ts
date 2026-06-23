import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { buildPage, normalizeLimit, Page } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { postIncludeFor, PostView, toPostView } from '../posts/post.serializer';
import { parseHashtags } from './hashtag.utils';

@Injectable()
export class HashtagService {
  constructor(private readonly prisma: PrismaService) {}

  /** Post yaratilganda/caption tahrirlanganda hashtag sync qilinadi. */
  async syncPostHashtags(postId: string, caption: string | null | undefined): Promise<void> {
    const names = parseHashtags(caption);

    await this.prisma.postHashtag.deleteMany({ where: { postId } });
    if (names.length === 0) return;

    for (const name of names) {
      const hashtag = await this.prisma.hashtag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await this.prisma.postHashtag.create({
        data: { postId, hashtagId: hashtag.id },
      }).catch(() => {}); // race condition — e'tiborsiz
    }
  }

  /** Hashtagga tegishli ochiq postlarni cursor-pagination bilan qaytaradi. */
  async listByTag(
    tag: string,
    viewer: User,
    cursor?: string,
    limit?: number,
  ): Promise<Page<PostView> & { tag: string; postCount: number }> {
    const name = tag.toLowerCase().replace(/^#/, '');
    const take = normalizeLimit(limit);

    const hashtag = await this.prisma.hashtag.findUnique({ where: { name } });
    if (!hashtag) {
      return { items: [], nextCursor: null, tag: name, postCount: 0 };
    }

    const postCount = await this.prisma.postHashtag.count({
      where: {
        hashtagId: hashtag.id,
        post: {
          deletedAt: null,
          author: { isPrivate: false, isBlocked: false },
        },
      },
    });

    const rows = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
        author: { isPrivate: false, isBlocked: false },
        hashtags: { some: { hashtagId: hashtag.id } },
      },
      include: postIncludeFor(viewer.id),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const page = buildPage(rows, take, (r) => r.id);
    return {
      items: page.items.map(toPostView),
      nextCursor: page.nextCursor,
      tag: name,
      postCount,
    };
  }
}
