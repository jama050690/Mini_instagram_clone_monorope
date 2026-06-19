import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { User } from '@/entities/user';
import { getApiErrorMessage } from '@/shared/api';
import { Button, Input, Label } from '@/shared/ui';
import { useUpdateProfile } from '../api/use-profile';
import { editProfileSchema, type EditProfileValues } from '../model/schemas';

export function ProfileEditForm({ user }: { user: User }) {
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: user.fullName,
      username: user.username,
      bio: user.bio ?? '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: (updated) =>
        reset({ fullName: updated.fullName, username: updated.username, bio: updated.bio ?? '' }),
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {update.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(update.error)}
        </p>
      ) : null}
      {update.isSuccess && !isDirty ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Saqlandi ✓</p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="fullName">To`liq ism</Label>
        <Input id="fullName" aria-invalid={!!errors.fullName} {...register('fullName')} />
        {errors.fullName ? <p className="text-sm text-destructive">{errors.fullName.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" aria-invalid={!!errors.username} {...register('username')} />
        {errors.username ? <p className="text-sm text-destructive">{errors.username.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-[invalid=true]:border-destructive"
          aria-invalid={!!errors.bio}
          {...register('bio')}
        />
        {errors.bio ? <p className="text-sm text-destructive">{errors.bio.message}</p> : null}
      </div>

      <Button type="submit" loading={update.isPending} disabled={!isDirty}>
        Saqlash
      </Button>
    </form>
  );
}
