import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label } from '@/shared/ui';
import { registerSchema, type RegisterValues } from '../model/schemas';
import { useRegisterMutation } from '../api/use-auth';
import { FieldError, FormError } from './form-error';

export function RegisterForm() {
  const navigate = useNavigate();
  const signup = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit((values) => {
    signup.mutate(values, { onSuccess: () => navigate('/', { replace: true }) });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError error={signup.error} />
      <div className="space-y-1.5">
        <Label htmlFor="fullName">To`liq ism</Label>
        <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...register('fullName')} />
        <FieldError message={errors.fullName?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" autoComplete="username" aria-invalid={!!errors.username} {...register('username')} />
        <FieldError message={errors.username?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Parol</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        <FieldError message={errors.password?.message} />
      </div>
      <Button type="submit" className="w-full" loading={signup.isPending}>
        Ro`yxatdan o`tish
      </Button>
    </form>
  );
}
