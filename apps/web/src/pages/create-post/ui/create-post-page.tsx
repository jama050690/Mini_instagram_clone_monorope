import { CreatePostForm } from '@/features/post';

export function CreatePostPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Yangi post</h1>
      <CreatePostForm />
    </div>
  );
}
