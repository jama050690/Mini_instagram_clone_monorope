import { ImagePlus, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '@/shared/api';
import { Button, Textarea } from '@/shared/ui';
import { useCreatePost } from '../api/use-post';
import { CAPTION_MAX_LENGTH, validateSelection } from '../model/validation';

/** Tanlangan fayl + lokal preview URL (authsiz — bu mijozdagi File). */
interface Picked {
  file: File;
  url: string;
}

export function CreatePostForm() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreatePost();

  const [picked, setPicked] = useState<Picked[]>([]);
  const [caption, setCaption] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const isVideo = useMemo(
    () => picked.some((p) => p.file.type.startsWith('video/')),
    [picked],
  );

  function handleSelect(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    const { error } = validateSelection(files);
    setLocalError(error);
    setPicked((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    });
  }

  function reset() {
    picked.forEach((p) => URL.revokeObjectURL(p.url));
    setPicked([]);
    setCaption('');
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleSubmit() {
    const { error } = validateSelection(picked.map((p) => p.file));
    if (error) {
      setLocalError(error);
      return;
    }
    create.mutate(
      { files: picked.map((p) => p.file), caption: caption.trim() || undefined },
      {
        onSuccess: (post) => {
          reset();
          navigate(`/p/${post.id}`);
        },
      },
    );
  }

  const error =
    localError ?? (create.error ? getApiErrorMessage(create.error) : null);

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={(e) => handleSelect(e.target.files)}
      />

      {picked.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:bg-accent"
        >
          <ImagePlus className="size-10" />
          <span className="text-sm font-medium">Rasm yoki video tanlang</span>
          <span className="text-xs">Karusel uchun bir nechta rasm (max 10)</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {picked.map((p) => (
              <div
                key={p.url}
                className="relative aspect-square overflow-hidden rounded-md bg-muted"
              >
                {isVideo ? (
                  <video src={p.url} className="size-full object-cover" />
                ) : (
                  <img src={p.url} alt="" className="size-full object-cover" />
                )}
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Boshqa tanlash
          </Button>
        </div>
      )}

      <div className="space-y-1">
        <Textarea
          placeholder="Caption yozing (ixtiyoriy)"
          value={caption}
          maxLength={CAPTION_MAX_LENGTH}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
        />
        <p className="text-right text-xs text-muted-foreground">
          {caption.length}/{CAPTION_MAX_LENGTH}
        </p>
      </div>

      {error ? (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <X className="size-4" /> {error}
        </p>
      ) : null}

      <Button
        className="w-full"
        disabled={picked.length === 0}
        loading={create.isPending}
        onClick={handleSubmit}
      >
        Joylash
      </Button>
    </div>
  );
}
