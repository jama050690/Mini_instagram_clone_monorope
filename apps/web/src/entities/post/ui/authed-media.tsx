import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/shared/api';
import { cn } from '@/shared/lib/cn';
import type { PostMedia } from '../model/types';

/**
 * Post mediasi avtorizatsiyali (`GET /api/v1/media/:id`, JWT Bearer) uzatiladi —
 * oddiy `<img src>` token yubormaydi. Shuning uchun blob'ni axios (Bearer +
 * refresh interceptor) orqali yuklab, object URL bilan ko'rsatamiz. React Query
 * media id bo'yicha keshlaydi (qayta yuklamaydi).
 */
async function fetchMediaObjectUrl(mediaId: string): Promise<string> {
  const res = await apiClient.get<Blob>(`/media/${mediaId}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(res.data);
}

interface AuthedMediaProps {
  media: PostMedia;
  className?: string;
  /** Video uchun nazorat tugmalari (grid thumbnail'da false). */
  controls?: boolean;
}

export function AuthedMedia({
  media,
  className,
  controls = true,
}: AuthedMediaProps) {
  const { data: src, isLoading } = useQuery({
    queryKey: ['media', media.id],
    queryFn: () => fetchMediaObjectUrl(media.id),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (isLoading || !src) {
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)}>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return media.kind === 'VIDEO' ? (
    <video src={src} className={className} controls={controls} playsInline />
  ) : (
    <img src={src} alt="" className={className} />
  );
}
