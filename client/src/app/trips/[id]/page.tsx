'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Tag, MessageSquare, Clipboard, Edit, Trash2, ArrowLeft, BedDouble, AlertCircle, Clock, Compass } from 'lucide-react';
import * as tripService from '@/services/trip.service';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export default function TripDetailsPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tripId = params.id as string;

  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'hotels'>('itinerary');

  // Fetch Trip Details
  const { data: trip, isLoading, isError, error } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripService.getTripById(tripId),
  });

  // Delete Trip Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => tripService.deleteTrip(id),
    onSuccess: () => {
      toast.success('Trip deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      router.push('/dashboard');
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message || (err as Error).message || 'Failed to delete trip');
    },
  });

  const handleDelete = () => {
    if (trip && confirm(`Are you sure you want to delete your trip to ${trip.destination}?`)) {
      deleteMutation.mutate(trip._id);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper to calculate total cost of activities for a single day
  const calculateDayCost = (day: tripService.DayPlan) => {
    return day.activities.reduce((acc, act) => acc + (act.cost || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-zinc-50 flex flex-col items-center justify-center p-12">
        <div className="animate-pulse flex flex-col items-center space-y-4 w-full max-w-3xl">
          <div className="h-6 bg-zinc-200 rounded w-1/4" />
          <div className="h-10 bg-zinc-200 rounded w-1/2" />
          <div className="h-64 bg-zinc-200 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="flex-1 bg-zinc-50 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <h3 className="text-xl font-bold text-zinc-950">Failed to load trip details</h3>
        <p className="text-sm text-zinc-500 mt-2 max-w-xs">
          {(error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'The requested trip could not be found or you do not have permission to view it.'}
        </p>
        <Link href="/dashboard" className="mt-6 flex h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white transition-colors hover:bg-indigo-700">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-zinc-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back Link */}
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Trip Summary Header */}
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 md:p-8 shadow-sm mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mb-3">
              {trip.companions}
            </span>
            <h1 className="text-3xl font-extrabold text-zinc-950 flex items-center gap-2 flex-wrap">
              <MapPin className="h-6 w-6 text-zinc-400" />
              <span>Trip to {trip.destination}</span>
            </h1>
            <div className="mt-3 flex flex-wrap gap-y-2 gap-x-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-zinc-400" />
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({trip.durationInDays} days)
              </span>
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-zinc-400" />
                Budget Limit: {formatCurrency(trip.budgetLimit)}
              </span>
            </div>
            {/* Interests */}
            {trip.interests.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {trip.interests.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-0.5 text-xs font-medium text-zinc-600 border border-zinc-200">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap gap-2.5 border-t border-zinc-100 md:border-none pt-4 md:pt-0">
            <Link
              href={`/trips/${trip._id}/edit`}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </Link>
            <Link
              href={`/trips/${trip._id}/assistant`}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Trip Assistant</span>
            </Link>
            <Link
              href={`/trips/${trip._id}/history`}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
            >
              <Clipboard className="h-4 w-4" />
              <span>History</span>
            </Link>
            <button
              onClick={handleDelete}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors hover:border-red-100"
              title="Delete Trip"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-zinc-200 mb-8 flex space-x-8">
          {(['itinerary', 'budget', 'hotels'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-semibold border-b-2 transition-all relative capitalize ${
                  isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-950'
                }`}
              >
                {tab === 'hotels' ? 'Hotel Suggestions' : tab === 'budget' ? 'Budget Breakdown' : tab}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {/* Tab 1: Itinerary */}
          {activeTab === 'itinerary' && (
            <div className="space-y-6">
              {trip.itinerary.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center">
                  <Compass className="h-10 w-10 text-zinc-300 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold text-zinc-900">No itinerary created yet</h3>
                  <p className="text-sm text-zinc-500 mt-1">This trip is currently blank. Tap Edit to build your itinerary manually.</p>
                  <Link href={`/trips/${trip._id}/edit`} className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-4 font-semibold text-white transition-colors hover:bg-indigo-700">
                    Build Itinerary
                  </Link>
                </div>
              ) : (
                trip.itinerary.map((day) => (
                  <motion.div
                    key={day.dayNumber}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm"
                  >
                    {/* Day Header */}
                    <div className="flex justify-between items-center border-b border-zinc-50 pb-4 mb-4">
                      <h3 className="text-lg font-bold text-zinc-950">Day {day.dayNumber}</h3>
                      <span className="text-xs font-semibold text-zinc-500 bg-zinc-50 rounded-md px-2 py-1">
                        Daily Budget: {formatCurrency(calculateDayCost(day))}
                      </span>
                    </div>

                    {/* Daily Activities List */}
                    {day.activities.length === 0 ? (
                      <p className="text-sm text-zinc-400 italic">No activities planned for this day.</p>
                    ) : (
                      <div className="space-y-6 relative border-l-2 border-zinc-100 pl-6 ml-3">
                        {day.activities.map((act, actIdx) => (
                          <div key={actIdx} className="relative">
                            {/* Dot indicator */}
                            <div className="absolute left-[-31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm" />
                            
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-base font-bold text-zinc-950 flex items-center gap-1.5">
                                  {act.time && (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                      <Clock className="h-3 w-3" />
                                      {act.time}
                                    </span>
                                  )}
                                  <span>{act.activity}</span>
                                </h4>
                                <span className="text-xs font-bold text-zinc-950">{formatCurrency(act.cost || 0)}</span>
                              </div>
                              {act.location && (
                                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{act.location}</span>
                                </p>
                              )}
                              {act.description && (
                                <p className="text-sm text-zinc-600 mt-2 leading-relaxed bg-zinc-50/50 rounded-xl p-3 border border-zinc-100/50">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Budget Breakdown */}
          {activeTab === 'budget' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-zinc-100 bg-white p-6 md:p-8 shadow-sm"
            >
              <h3 className="text-lg font-bold text-zinc-950 mb-6">Expense Estimation Breakdown</h3>
              
              {!trip.budgetEstimation ? (
                <div className="text-center py-6 text-zinc-400 italic text-sm">
                  No estimated budget calculations available for this trip.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Category bars */}
                  {[
                    { label: 'Flights & Transit', val: trip.budgetEstimation.flights, color: 'bg-blue-600' },
                    { label: 'Hotels & Accommodation', val: trip.budgetEstimation.hotels, color: 'bg-indigo-600' },
                    { label: 'Food & Meals', val: trip.budgetEstimation.food, color: 'bg-amber-500' },
                    { label: 'Local Transport', val: trip.budgetEstimation.transport, color: 'bg-teal-500' },
                    { label: 'Sightseeing & Activities', val: trip.budgetEstimation.activities, color: 'bg-pink-500' },
                    { label: 'Miscellaneous & Backup', val: trip.budgetEstimation.miscellaneous, color: 'bg-zinc-400' },
                  ].map((cat, idx) => {
                    const total = trip.budgetEstimation?.total || 1;
                    const percent = Math.min(100, Math.max(0, (cat.val / total) * 100));
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-zinc-700">{cat.label}</span>
                          <span className="font-bold text-zinc-950">{formatCurrency(cat.val)} ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Summary Total */}
                  <div className="border-t border-zinc-100 pt-6 mt-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <span className="text-sm text-zinc-500">Estimated Total Cost</span>
                      <h4 className="text-2xl font-black text-indigo-600 mt-1">{formatCurrency(trip.budgetEstimation.total)}</h4>
                    </div>
                    <div>
                      <span className="text-sm text-zinc-500">Your Budget Limit</span>
                      <h4 className="text-xl font-bold text-zinc-900 mt-1">{formatCurrency(trip.budgetLimit)}</h4>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 3: Hotel Suggestions */}
          {activeTab === 'hotels' && (
            <div className="space-y-6">
              {!trip.hotelSuggestions || trip.hotelSuggestions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center">
                  <BedDouble className="h-10 w-10 text-zinc-300 mb-4 mx-auto" />
                  <h3 className="text-lg font-bold text-zinc-900">No hotel recommendations found</h3>
                  <p className="text-sm text-zinc-500 mt-1">Wayfarer.ai has not made any hotel suggestions for this trip.</p>
                </div>
              ) : (
                trip.hotelSuggestions.map((hotel, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start"
                  >
                    {/* Hotel Details Card */}
                    <div className="flex-1 space-y-4 w-full">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-zinc-950">{hotel.name}</h3>
                          {hotel.address && (
                            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{hotel.address}</span>
                            </p>
                          )}
                        </div>
                        {hotel.rating && (
                          <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                            <span>★</span>
                            <span>{hotel.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {hotel.description && (
                        <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50/50 rounded-xl p-4 border border-zinc-100/50">
                          {hotel.description}
                        </p>
                      )}

                      <div className="flex justify-between items-center border-t border-zinc-50 pt-4 text-sm font-semibold">
                        <span className="text-zinc-500">Typical Price / Night</span>
                        <span className="text-zinc-950 text-base">{formatCurrency(hotel.pricePerNight)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
