'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { MapPin, DollarSign, Loader2, ArrowLeft, Trash2, Plus, Clock, Save, FileText, Check, Edit } from 'lucide-react';
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

const editTripSchema = z.object({
  destination: z.string().trim().min(1, 'Destination is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budgetLimit: z.coerce.number().positive('Budget limit must be greater than 0'),
  companions: z.string().min(1, 'Companion type is required'),
  interests: z.array(z.string()),
});

type EditTripFormValues = z.infer<typeof editTripSchema>;

export default function TripEditPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [itinerary, setItinerary] = useState<tripService.DayPlan[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Trip Data
  const { data: trip, isLoading, isError } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripService.getTripById(tripId),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editTripSchema),
  });

  const selectedInterests = watch('interests') || [];

  // Populate form values when data loaded
  useEffect(() => {
    if (trip) {
      reset({
        destination: trip.destination,
        startDate: trip.startDate.split('T')[0],
        endDate: trip.endDate.split('T')[0],
        budgetLimit: trip.budgetLimit,
        companions: trip.companions,
        interests: trip.interests,
      });
      setItinerary(JSON.parse(JSON.stringify(trip.itinerary)));
    }
  }, [trip, reset]);

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

  // Activity mutation operations
  const handleAddActivity = (dayIndex: number) => {
    const newItinerary = [...itinerary];
    newItinerary[dayIndex].activities.push({
      time: 'Morning',
      activity: '',
      description: '',
      location: '',
      cost: 0,
    });
    setItinerary(newItinerary);
  };

  const handleRemoveActivity = (dayIndex: number, actIndex: number) => {
    const newItinerary = [...itinerary];
    newItinerary[dayIndex].activities.splice(actIndex, 1);
    setItinerary(newItinerary);
  };

  const handleUpdateActivity = (
    dayIndex: number,
    actIndex: number,
    field: keyof tripService.Activity,
    value: string | number
  ) => {
    const newItinerary = [...itinerary];
    newItinerary[dayIndex].activities[actIndex] = {
      ...newItinerary[dayIndex].activities[actIndex],
      [field]: field === 'cost' ? parseFloat(value as string) || 0 : value,
    };
    setItinerary(newItinerary);
  };

  const onSubmit = async (data: FieldValues) => {
    const values = data as EditTripFormValues;
    setIsSaving(true);
    try {
      await tripService.updateTrip(tripId, {
        ...values,
        itinerary,
      });
      toast.success('Itinerary updated successfully');
      router.push(`/trips/${tripId}`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message || (err as Error).message || 'Failed to update itinerary');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-zinc-50 flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="flex-1 bg-zinc-50 flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-xl font-bold text-zinc-950">Failed to load trip</h3>
        <button onClick={() => router.back()} className="mt-4 h-9 rounded-xl bg-indigo-600 px-4 font-semibold text-white">
          Back
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-zinc-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Cancel & Back</span>
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-950 flex items-center gap-2">
            <Edit className="h-7 w-7 text-indigo-600" />
            <span>Edit Travel Plan</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Make changes to trip metadata or manually adjust day activities</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Metadata Section */}
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-950 border-b border-zinc-50 pb-3 mb-5 flex items-center gap-2">
              <FileText className="h-5 w-5 text-zinc-400" />
              <span>Trip Metadata</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Destination */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700">Destination</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                  {...register('destination')}
                />
                {errors.destination && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.destination.message)}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">Start Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.startDate.message)}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">End Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.endDate.message)}</p>
                )}
              </div>

              {/* Budget Limit */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">Budget Limit (INR)</label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                  {...register('budgetLimit')}
                />
                {errors.budgetLimit && (
                  <p className="mt-1 text-xs text-red-600">{String(errors.budgetLimit.message)}</p>
                )}
              </div>

              {/* Companions */}
              <div>
                <label className="block text-sm font-medium text-zinc-700">Companion Type</label>
                <select
                  className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white py-2.5 px-3.5 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
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

            {/* Interest Tags */}
            <div className="border-t border-zinc-100 pt-6 mt-6">
              <label className="block text-sm font-medium text-zinc-700 mb-3">Travel Tags</label>
              <div className="flex flex-wrap gap-2">
                {interestTags.map((tag) => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      <span>{tag}</span>
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Itinerary Edit Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-zinc-950">Daily Itinerary Activities</h2>
            {itinerary.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center text-zinc-400">
                Adjust dates to generate days.
              </div>
            ) : (
              itinerary.map((day, dayIdx) => (
                <div key={dayIdx} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                  {/* Day Header */}
                  <div className="flex justify-between items-center border-b border-zinc-50 pb-4 mb-6">
                    <h3 className="text-lg font-bold text-zinc-950">Day {day.dayNumber}</h3>
                    <button
                      type="button"
                      onClick={() => handleAddActivity(dayIdx)}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Activity</span>
                    </button>
                  </div>

                  {/* Activity Forms */}
                  {day.activities.length === 0 ? (
                    <p className="text-sm text-zinc-400 italic py-2">No activities configured. Tap Add Activity above.</p>
                  ) : (
                    <div className="space-y-6">
                      {day.activities.map((act, actIdx) => (
                        <div key={actIdx} className="flex gap-4 items-start border-b border-zinc-50/50 pb-6 last:border-0 last:pb-0">
                          {/* Circle Day Tag */}
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-500 mt-2">
                            {actIdx + 1}
                          </div>

                          {/* Inputs Grid */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4">
                            {/* Time */}
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                                <Clock className="h-3.5 w-3.5" />
                              </div>
                              <input
                                type="text"
                                className="block w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-2.5 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-xs"
                                placeholder="Time (e.g. 09:00 AM)"
                                value={act.time || ''}
                                onChange={(e) => handleUpdateActivity(dayIdx, actIdx, 'time', e.target.value)}
                              />
                            </div>

                            {/* Activity name */}
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                className="block w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-xs"
                                placeholder="Activity description"
                                value={act.activity}
                                onChange={(e) => handleUpdateActivity(dayIdx, actIdx, 'activity', e.target.value)}
                                required
                              />
                            </div>

                            {/* Cost */}
                            <div className="relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                                <DollarSign className="h-3.5 w-3.5" />
                              </div>
                              <input
                                type="number"
                                className="block w-full rounded-xl border border-zinc-200 bg-white py-2 pl-8 pr-2.5 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-xs"
                                placeholder="Cost (INR)"
                                value={act.cost || 0}
                                onChange={(e) => handleUpdateActivity(dayIdx, actIdx, 'cost', e.target.value)}
                              />
                            </div>

                            {/* Location */}
                            <div className="sm:col-span-2 relative">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                                <MapPin className="h-3.5 w-3.5" />
                              </div>
                              <input
                                type="text"
                                className="block w-full rounded-xl border border-zinc-200 bg-white py-2 pl-9 pr-2.5 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-xs"
                                placeholder="Location/Address"
                                value={act.location || ''}
                                onChange={(e) => handleUpdateActivity(dayIdx, actIdx, 'location', e.target.value)}
                              />
                            </div>

                            {/* Detailed Description */}
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                className="block w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-zinc-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-xs"
                                placeholder="Short notes/description..."
                                value={act.description || ''}
                                onChange={(e) => handleUpdateActivity(dayIdx, actIdx, 'description', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveActivity(dayIdx, actIdx)}
                            className="text-zinc-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors mt-1.5"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
