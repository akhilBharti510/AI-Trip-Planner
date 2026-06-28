'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Compass, User as UserIcon, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must match'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage(): React.ReactElement {
  const { register: signup } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signup(values.name, values.email, values.password);
      toast.success('Welcome to Wayfarer.ai!');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || (err as Error).message || 'Registration failed. Please try again.');
      toast.error('Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Background blur accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-100 bg-white p-8 shadow-md"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl tracking-tight text-zinc-950 mb-6">
            <Compass className="h-6 w-6 text-indigo-600 animate-pulse" />
            <span>Wayfarer<span className="text-indigo-600">.ai</span></span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Create an Account</h2>
          <p className="mt-2 text-sm text-zinc-500">Sign up and plan your next destination</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">Full Name</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <UserIcon className="h-4 w-4" />
              </div>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-zinc-900 placeholder-zinc-400 transition-all focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                placeholder="John Doe"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">Email Address</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-zinc-900 placeholder-zinc-400 transition-all focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                placeholder="name@example.com"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">Password</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type="password"
                className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-zinc-900 placeholder-zinc-400 transition-all focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                placeholder="••••••••"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700">Confirm Password</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-zinc-900 placeholder-zinc-400 transition-all focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="text-center text-sm text-zinc-600 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
