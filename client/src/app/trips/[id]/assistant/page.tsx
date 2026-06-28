'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Send, ArrowLeft, Loader2, Bot, User as UserIcon, History } from 'lucide-react';
import * as tripService from '@/services/trip.service';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export default function AssistantPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tripId = params.id as string;

  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Trip details (left panel)
  const { data: trip, isLoading: isTripLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => tripService.getTripById(tripId),
  });

  // 2. Fetch Chat History (right panel)
  const { data: chat, isLoading: isChatLoading } = useQuery({
    queryKey: ['chat', tripId],
    queryFn: () => tripService.getChatHistory(tripId),
  });

  // 3. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => tripService.interactWithAssistant(tripId, message),
    onSuccess: (data) => {
      setInputMessage('');
      toast.success('Itinerary adjusted successfully!');
      
      // Update trip and chat in local caches immediately
      queryClient.setQueryData(['trip', tripId], data.trip);
      queryClient.setQueryData(['chat', tripId], data.chat);
      queryClient.invalidateQueries({ queryKey: ['history', tripId] });
    },
    onError: (err: unknown) => {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message || (err as Error).message || 'Failed to send message');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(inputMessage.trim());
  };

  // Scroll chat to bottom when messages load/update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat?.messages, sendMessageMutation.isPending]);

  const calculateDayCost = (day: tripService.DayPlan) => {
    return day.activities.reduce((acc, act) => acc + (act.cost || 0), 0);
  };

  const isPending = sendMessageMutation.isPending;

  return (
    <main className="flex-1 bg-zinc-50 flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="border-b border-zinc-100 bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-zinc-950 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
              <span>AI Trip Assistant</span>
            </h1>
            {trip && (
              <p className="text-xs text-zinc-500">
                Editing trip to {trip.destination} ({trip.durationInDays} days)
              </p>
            )}
          </div>
        </div>

        <Link
          href={`/trips/${tripId}/history`}
          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950"
        >
          <History className="h-3.5 w-3.5" />
          <span>View Change Logs</span>
        </Link>
      </div>

      {/* Main split dashboard panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Itinerary Preview Panel */}
        <section className="w-full md:w-1/2 border-r border-zinc-100 bg-zinc-50/50 p-6 overflow-y-auto hidden md:block">
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4">Current Itinerary Preview</h2>
            
            {isTripLoading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-zinc-200 rounded-xl" />
                <div className="h-48 bg-zinc-200 rounded-xl" />
              </div>
            )}

            {trip && trip.itinerary.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center text-zinc-400">
                Itinerary is currently empty. Ask the assistant to generate one!
              </div>
            )}

            {trip && trip.itinerary.map((day) => (
              <div key={day.dayNumber} className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="flex justify-between items-center border-b border-zinc-50 pb-3 mb-4">
                  <h3 className="text-base font-bold text-zinc-950">Day {day.dayNumber}</h3>
                  <span className="text-xs font-semibold text-zinc-500 bg-zinc-50 rounded-md px-2 py-0.5">
                    {formatCurrency(calculateDayCost(day))}
                  </span>
                </div>

                <div className="space-y-4">
                  {day.activities.map((act, actIdx) => (
                    <div key={actIdx} className="text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                          {act.time && <span className="text-2xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">{act.time}</span>}
                          <span>{act.activity}</span>
                        </div>
                        <span className="font-semibold text-zinc-500 text-xs">{formatCurrency(act.cost || 0)}</span>
                      </div>
                      {act.description && <p className="text-xs text-zinc-600 mt-1 pl-2 border-l border-zinc-100">{act.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: Assistant Chat Panel */}
        <section className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isChatLoading && (
              <div className="flex items-center justify-center h-full text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading chat history...</span>
              </div>
            )}

            {chat && chat.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                <Bot className="h-10 w-10 text-indigo-600 mb-4 animate-bounce" />
                <h3 className="text-base font-bold text-zinc-950">I&apos;m your Wayfarer Assistant</h3>
                <p className="text-xs text-zinc-500 mt-2">
                  Ask me to make adjustments to your travel plan. Try commands like:
                </p>
                <div className="mt-4 w-full grid grid-cols-1 gap-2">
                  {[
                    'Replace Day 2 with outdoor hiking adventure',
                    'Reduce the budget limit',
                    'Move shopping to the afternoon of Day 1',
                    'Suggest some top local museums',
                  ].map((tip) => (
                    <button
                      key={tip}
                      onClick={() => setInputMessage(tip)}
                      className="text-left text-xs bg-zinc-50 border border-zinc-100 rounded-xl p-3 hover:border-zinc-200 hover:bg-zinc-100/50 transition-all text-zinc-600"
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chat && chat.messages.map((msg, idx) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 max-w-[85%] ${isAssistant ? 'self-start' : 'self-end flex-row-reverse ml-auto'}`}
                >
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border text-white ${
                    isAssistant ? 'bg-indigo-600 border-indigo-600' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}>
                    {isAssistant ? <Bot className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    isAssistant
                      ? 'bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-tl-none'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              );
            })}

            {/* Pending Loader bubble */}
            {isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 self-start max-w-[85%]"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 border border-indigo-600 text-white">
                  <Bot className="h-4 w-4 animate-spin-slow" />
                </div>
                <div className="rounded-2xl px-4 py-3 text-sm bg-zinc-50 border border-zinc-100 text-zinc-500 rounded-tl-none flex items-center gap-2">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-indigo-600" />
                  <span>Modifying itinerary day structure...</span>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form Input */}
          <div className="border-t border-zinc-100 p-4 bg-white">
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="text"
                className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 px-4 text-zinc-900 placeholder-zinc-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm"
                placeholder="Ask assistant to update plan..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isPending}
              />
              <button
                type="submit"
                disabled={isPending || !inputMessage.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
