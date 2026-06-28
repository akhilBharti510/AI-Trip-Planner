'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, Calendar, DollarSign, Users, Plane, Loader2, ArrowLeft, Check } from 'lucide-react';
import * as tripService from '@/services/trip.service';
import { toast } from 'sonner';

const companionOptions = [
  { value: 'Solo', label: 'Going Solo', icon: '👤' },
  { value: 'Couple', label: 'As a Couple', icon: '👩‍❤️‍👨' },
  { value: 'Family', label: 'With Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'Friends', label: 'With Friends', icon: '👥' },
];

const interestTags = [
  'Culture & History',
  'Nature & Adventure',
  'Food & Culinary',
  'Beaches & Relaxation',
  'Shopping',
  'Nightlife & Clubs',
  'Museums & Galleries',
  'Photography',
];

const createTripSchema = z.object({
  destination: z.string().trim().min(1, 'Destination is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budgetLimit: z.coerce.number().positive('Budget limit must be greater than 0'),
  companions: z.string().min(1, 'Please select your companion type'),
  interests: z.array(z.string()),
});

type CreateTripFormValues = z.infer<typeof createTripSchema>;

export default function CreateTripPage(): React.ReactElement {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const steps = [
    'Reaching out to travel experts...',
    'Drafting day-by-day itineraries...',
    'Formulating local budget benchmarks...',
    'Selecting recommended hotel stays...',
    'Finalizing details...',
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      destination: '',
      startDate: '',
      endDate: '',
      budgetLimit: 50000,
      companions: 'Solo',
      interests: [],
    },
  });
  const selectedInterests = watch('interests');

  const toggleInterest = (tag: string) => {
    const current = [...selectedInterests];
    const idx = current.indexOf(tag);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(tag);
    }
    setValue('interests', current);
  };

  // Run progress animations during AI generation
  const runAiLoadingProgress = () => {
    setGenerationStep(0);
    const interval = setInterval(() => {
      setGenerationStep((step) => {
        if (step >= steps.length - 1) {
          clearInterval(interval);
          return step;
        }
        return step + 1;
      });
    }, 4500); // cycle through steps
    return () => clearInterval(interval);
  };

  const handleGenerate = async (data: FieldValues) => {
    const values = data as CreateTripFormValues;
    setIsGenerating(true);
    const stopProgress = runAiLoadingProgress();
    try {
      const trip = await tripService.generateTrip(values);
      toast.success('Your AI trip is ready!');
      router.push(`/trips/${trip._id}`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message || (err as Error).message || 'Failed to generate AI trip');
      setIsGenerating(false);
      stopProgress();
    }
  };

  const handleSaveManual = async (data: FieldValues) => {
    const values = data as CreateTripFormValues;
    setIsSavingManual(true);
    try {
      const trip = await tripService.createTrip({
        ...values,
        itinerary: [],
      });
      toast.success('Trip created successfully');
      router.push(`/trips/${trip._id}`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message || (err as Error).message || 'Failed to create trip');
      setIsSavingManual(false);
    }
  };

  return (
    <main className="flex-1 bg-zinc-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-950 flex items-center gap-2">
            <Plane className="h-7 w-7 text-indigo-600 animate-bounce" />
            <span>Plan Your Next Journey</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Configure your destination, dates, and preferences to start planning</p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 md:p-8 shadow-sm">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Destination */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700">Where are you going?</label>
                <input
                  type="text"
                  placeholder="e.g., Kyoto, Japan"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-zinc-900 placeholder-zinc-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                  {...register('destination')}
                />
                {errors.destination && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.destination.message)}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">Start Date</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    type="date"
                    className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                    {...register('startDate')}
                  />
                </div>
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.startDate.message)}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">End Date</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    type="date"
                    className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                    {...register('endDate')}
                  />
                </div>
                {errors.endDate && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.endDate.message)}</p>
                )}
              </div>

              {/* Budget Limit */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">Budget Limit (INR)</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <input
                    type="number"
                    className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                    {...register('budgetLimit')}
                  />
                </div>
                {errors.budgetLimit && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.budgetLimit.message)}</p>
                )}
              </div>

              {/* Companion options */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">Who is traveling with you?</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <select
                    className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm appearance-none"
                    {...register('companions')}
                  >
                    {companionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Travel Interests (Chips) */}
            <div className="border-t border-zinc-100 pt-6">
              <label className="block text-sm font-medium text-zinc-700 mb-3">Select your travel tags & interests</label>
              <div className="flex flex-wrap gap-2">
                {interestTags.map((tag) => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold border transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-950'
                      }`}
                    >
                      <span>{tag}</span>
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-zinc-100 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={handleSubmit(handleSaveManual)}
                disabled={isGenerating || isSavingManual}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-50"
              >
                {isSavingManual ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Create Manually</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleSubmit(handleGenerate)}
                disabled={isGenerating || isSavingManual}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-indigo-600/15 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate AI Itinerary</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Generation Steps Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md bg-white rounded-2xl border border-zinc-100 p-8 shadow-2xl flex flex-col items-center text-center space-y-6"
            >
              {/* Spinner Compass */}
              <div className="relative flex items-center justify-center h-20 w-20">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                <Compass className="h-10 w-10 text-indigo-600 animate-pulse" />
              </div>

              {/* Title */}
              <div>
                <h3 className="text-xl font-bold text-zinc-950">Generating Your Travel Package</h3>
                <p className="text-sm text-zinc-500 mt-2">Wayfarer.ai is planning your dream escape...</p>
              </div>

              {/* Step indicator */}
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-1000 ease-out"
                  style={{ width: `${((generationStep + 1) / steps.length) * 100}%` }}
                />
              </div>

              {/* Step label text */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={generationStep}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-semibold text-indigo-600"
                >
                  {steps[generationStep]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
