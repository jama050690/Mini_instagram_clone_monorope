import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label } from '@/shared/ui';
import { loginSchema, type LoginValues } from '../model/schemas';
import { useLoginMutation } from '../api/use-auth';
import { FieldError, FormError } from './form-error';

export function LoginForm() {
  const navigate = useNavigate();
  const login = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: () => navigate('/', { replace: true }) });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError error={login.error} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Parol</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <Button type="submit" className="w-full" loading={login.isPending}>
        Kirish
      </Button>
    </form>
  );
}
