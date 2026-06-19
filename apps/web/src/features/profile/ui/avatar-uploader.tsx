import { useRef, useState } from 'react';
import type { User } from '@/entities/user';
import { UserAvatar } from '@/entities/user';
import { getApiErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui';
import { useDeleteAvatar, useUploadAvatar } from '../api/use-profile';

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp';

export function AvatarUploader({ user }: { user: User }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const upload = useUploadAvatar();
  const remove = useDeleteAvatar();

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const file = e.target.files?.[0];
    e.target.value = ''; // bir xil faylni qayta tanlashga ruxsat
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setLocalError('Rasm hajmi 2MB dan oshmasligi kerak');
      return;
    }
    upload.mutate(file);
  };

  const error = localError ?? (upload.error ? getApiErrorMessage(upload.error) : null);

  return (
    <div className="flex items-center gap-4">
      <UserAvatar user={user} className="size-20" />
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={onSelect}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            Rasm yuklash
          </Button>
          {user.avatarUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={remove.isPending}
              onClick={() => remove.mutate()}
            >
              O`chirish
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">JPG, PNG yoki WEBP · max 2MB</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
