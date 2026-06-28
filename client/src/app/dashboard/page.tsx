'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, MapPin, Tag, Trash2, Eye, Sparkles, MessageSquare, AlertTriangle, Compass, Clipboard } from 'lucide-react';
import * as tripService from '@/services/trip.service';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export default function DashboardPage(): React.ReactElement {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 6;

  // 1. Fetch Trips Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['trips', search, page],
    queryFn: () => tripService.listTrips(search, page, limit),
    placeholderData: (prev) => prev, // keeps UI stable while searching/paginating
  });

  // 2. Delete Trip Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => tripService.deleteTrip(id),
    onSuccess: () => {
      toast.success('Trip deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message || (err as Error).message || 'Failed to delete trip');
    },
  });

  const handleDelete = (id: string, destination: string) => {
    if (confirm(`Are you sure you want to delete your trip to ${destination}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <main className="flex-1 bg-zinc-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-950">My Travel Plans</h1>
            <p className="text-sm text-zinc-500 mt-1">Manage and edit your upcoming travel itineraries</p>
          </div>
          <Link
            href="/trips/create"
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 self-start sm:self-auto"
          >
            <Sparkles className="h-4 w-4" />
            <span>Plan a New Trip</span>
          </Link>
        </div>

        {/* Search Filter */}
        <div className="relative w-full max-w-md mb-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-zinc-900 placeholder-zinc-400 transition-all focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
            placeholder="Search destination..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset page to 1 when search query changes
            }}
          />
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm animate-pulse flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-5 bg-zinc-200 rounded w-1/2" />
                  <div className="h-4 bg-zinc-100 rounded w-3/4" />
                  <div className="h-4 bg-zinc-100 rounded w-1/3" />
                </div>
                <div className="flex gap-3">
                  <div className="h-9 bg-zinc-100 rounded-lg w-1/2" />
                  <div className="h-9 bg-zinc-100 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/50 p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-red-600 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-zinc-900">Failed to load trips</h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm">
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message || error.message || 'An unexpected connection issue occurred.'}
            </p>
          </div>
        )}

        {/* Content list */}
        {!isLoading && !isError && data && (
          <>
            {data.trips.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white p-16 text-center">
                <Compass className="h-12 w-12 text-zinc-300 mb-4 animate-spin-slow" />
                <h3 className="text-lg font-bold text-zinc-900">No trips found</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-xs">
                  {search ? 'No saved trips match your search term.' : "You haven't planned any trips yet. Let Wayfarer.ai plan one for you!"}
                </p>
                <Link
                  href="/trips/create"
                  className="mt-6 flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Plan First Trip</span>
                </Link>
              </div>
            ) : (
              /* Grid Layout */
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {data.trips.map((trip) => (
                    <motion.div
                      key={trip._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group flex flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all hover:border-zinc-200 hover:shadow-md"
                    >
                      <div>
                        {/* Header details */}
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                            <span className="truncate">{trip.destination}</span>
                          </h3>
                          <button
                            onClick={() => handleDelete(trip._id, trip.destination)}
                            className="text-zinc-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Trip"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Date & Duration */}
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                          <span>
                            {formatDate(trip.startDate)} - {formatDate(trip.endDate)} ({trip.durationInDays} days)
                          </span>
                        </div>

                        {/* Budget breakdown brief */}
                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center rounded-md bg-zinc-50 px-2.5 py-1 font-medium text-zinc-600 ring-1 ring-inset ring-zinc-500/10">
                            Budget Limit: {formatCurrency(trip.budgetLimit)}
                          </span>
                          {trip.budgetEstimation && (
                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
                              Est. Total: {formatCurrency(trip.budgetEstimation.total)}
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {trip.companions}
                          </span>
                        </div>

                        {/* Interests */}
                        {trip.interests.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1">
                            {trip.interests.slice(0, 3).map((interest, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-indigo-50/50 px-2 py-0.5 text-2xs font-medium text-indigo-700 border border-indigo-100">
                                <Tag className="h-2.5 w-2.5" />
                                {interest}
                              </span>
                            ))}
                            {trip.interests.length > 3 && (
                              <span className="text-2xs text-zinc-400 self-center ml-1">
                                +{trip.interests.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Actions Footer */}
                      <div className="mt-6 pt-4 border-t border-zinc-50 grid grid-cols-3 gap-2">
                        <Link
                          href={`/trips/${trip._id}`}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Link>
                        
                        <Link
                          href={`/trips/${trip._id}/assistant`}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Assistant</span>
                        </Link>

                        <Link
                          href={`/trips/${trip._id}/history`}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                          <span>History</span>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination Controls */}
            {data.pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm font-medium text-zinc-600">
                  Page {data.page} of {data.pages}
                </span>
                <button
                  disabled={page === data.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
