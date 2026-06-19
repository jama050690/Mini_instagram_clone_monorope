import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label } from '@/shared/ui';
import { onboardingSchema, type OnboardingValues } from '../model/schemas';
import { useGoogleCompleteMutation } from '../api/use-auth';
import { FieldError, FormError } from './form-error';

/** Google bilan birinchi marta kirgan user uchun username tanlash. */
export function OnboardingForm({ registrationToken }: { registrationToken: string }) {
  const navigate = useNavigate();
  const complete = useGoogleCompleteMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingValues>({ resolver: zodResolver(onboardingSchema) });

  const onSubmit = handleSubmit((values) => {
    complete.mutate(
      { registrationToken, username: values.username },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError error={complete.error} />
      <div className="space-y-1.5">
        <Label htmlFor="username">Username tanlang</Label>
        <Input id="username" autoComplete="username" autoFocus aria-invalid={!!errors.username} {...register('username')} />
        <FieldError message={errors.username?.message} />
      </div>
      <Button type="submit" className="w-full" loading={complete.isPending}>
        Davom etish
      </Button>
    </form>
  );
}
