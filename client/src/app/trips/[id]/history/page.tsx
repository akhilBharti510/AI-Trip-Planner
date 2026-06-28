'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, History, ChevronDown, ChevronUp } from 'lucide-react';
import * as tripService from '@/services/trip.service';
import { formatCurrency } from '@/lib/format';

export default function TripHistoryPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // 1. Fetch Trip details (for context)
  const { data: trip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripService.getTripById(tripId),
  });

  // 2. Fetch modification logs
  const { data: logs, isLoading, isError } = useQuery({
    queryKey: ['history', tripId],
    queryFn: () => tripService.getTripHistory(tripId),
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId((curr) => (curr === id ? null : id));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="flex-1 bg-zinc-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-950 flex items-center gap-2">
            <History className="h-7 w-7 text-indigo-600" />
            <span>Itinerary Change Logs</span>
          </h1>
          {trip && (
            <p className="text-sm text-zinc-500 mt-1">
              Version history of modifications made to your trip to {trip.destination}
            </p>
          )}
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((n) => (
              <div key={n} className="h-24 bg-zinc-200 rounded-2xl w-full" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-12 text-center text-red-600">
            Failed to load change logs history.
          </div>
        )}

        {/* Content list */}
        {!isLoading && !isError && logs && (
          <>
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-16 text-center">
                <Clock className="h-10 w-10 text-zinc-300 mb-4 mx-auto" />
                <h3 className="text-lg font-bold text-zinc-900 font-sans">No edits recorded</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs mx-auto">
                  When you use the AI Assistant to adjust your trip, those revisions will show up here.
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-zinc-200 pl-6 ml-3 space-y-8">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log._id;
                  return (
                    <div key={log._id} className="relative">
                      {/* Circle Dot indicator */}
                      <div className="absolute left-[-31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-600 shadow-sm animate-pulse" />

                      <div className="rounded-2xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
                        {/* Header accordion trigger */}
                        <button
                          onClick={() => toggleExpand(log._id)}
                          className="w-full text-left p-6 flex justify-between items-start gap-4 transition-colors hover:bg-zinc-50/50"
                        >
                          <div className="space-y-2 flex-1">
                            <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(log.modifiedAt)}
                            </span>
                            <h3 className="text-base font-bold text-zinc-950 pr-4">{log.changeSummary}</h3>
                          </div>
                          <div className="text-zinc-400 p-1 rounded-lg border border-zinc-100 mt-1">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </button>

                        {/* Expandable comparison diff */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-zinc-100 bg-zinc-50/50 p-6 space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Itinerary Snapshot Comparisons</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Previous */}
                                  <div className="space-y-4">
                                    <h5 className="text-sm font-semibold text-zinc-600 flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-red-500" />
                                      <span>Previous Version</span>
                                    </h5>
                                    <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3 max-h-80 overflow-y-auto">
                                      {log.previousItinerary.map((day: tripService.DayPlan, dIdx) => (
                                        <div key={dIdx} className="text-xs space-y-2">
                                          <div className="font-bold border-b border-zinc-50 pb-1">Day {day.dayNumber}</div>
                                          {day.activities.map((act: tripService.Activity, aIdx: number) => (
                                            <div key={aIdx} className="flex justify-between items-center text-zinc-600">
                                              <span>• {act.activity}</span>
                                              <span>{formatCurrency(act.cost || 0)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* New */}
                                  <div className="space-y-4">
                                    <h5 className="text-sm font-semibold text-zinc-600 flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                      <span>Updated Version</span>
                                    </h5>
                                    <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3 max-h-80 overflow-y-auto">
                                      {log.newItinerary.map((day: tripService.DayPlan, dIdx) => (
                                        <div key={dIdx} className="text-xs space-y-2">
                                          <div className="font-bold border-b border-zinc-50 pb-1">Day {day.dayNumber}</div>
                                          {day.activities.map((act: tripService.Activity, aIdx: number) => (
                                            <div key={aIdx} className="flex justify-between items-center text-zinc-900">
                                              <span>• {act.activity}</span>
                                              <span className="font-semibold">{formatCurrency(act.cost || 0)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
