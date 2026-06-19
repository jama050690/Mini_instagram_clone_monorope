import { Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { CommentSection, LikeBar } from '@/features/engagement';
import { PostCard, usePost } from '@/features/post';
import { getApiErrorMessage } from '@/shared/api';

export function PostPage() {
  const { id = '' } = useParams();
  const { data: post, isLoading, error } = usePost(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        {error ? getApiErrorMessage(error, 'Post topilmadi') : 'Post topilmadi'}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <PostCard post={post} />
      <LikeBar post={post} />
      <hr className="border-border" />
      <CommentSection post={post} />
    </div>
  );
}
