'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { User as UserIcon, Mail, Calendar, Compass, LogOut, Loader2, Sparkles, Map, DollarSign, ListTodo } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import * as tripService from '@/services/trip.service';
import { formatCurrency } from '@/lib/format';

export default function ProfilePage(): React.ReactElement {
  const { user, logout } = useAuth();

  // Fetch all trips to calculate stats
  const { data, isLoading } = useQuery({
    queryKey: ['trips', 'profile-stats'],
    queryFn: () => tripService.listTrips(undefined, 1, 100), // fetch up to 100 trips for stats
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateStats = () => {
    if (!data) return { count: 0, totalBudget: 0, avgDuration: 0 };
    const trips = data.trips;
    const count = trips.length;
    const totalBudget = trips.reduce((acc, t) => acc + t.budgetLimit, 0);
    const totalDuration = trips.reduce((acc, t) => acc + t.durationInDays, 0);
    return {
      count,
      totalBudget,
      avgDuration: count > 0 ? Math.round(totalDuration / count) : 0,
    };
  };

  const stats = calculateStats();

  if (isLoading || !user) {
    return (
      <div className="flex-1 bg-zinc-50 flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <main className="flex-1 bg-zinc-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-zinc-950 flex items-center gap-2">
            <UserIcon className="h-7 w-7 text-indigo-600" />
            <span>Account Profile</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your account details and view travel statistics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left panel: Info & Actions */}
          <div className="md:col-span-1 space-y-6">
            {/* User Profile Card */}
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm flex flex-col items-center text-center">
              {/* Avatar circle */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 border-2 border-indigo-100 text-indigo-600 text-3xl font-bold mb-4 shadow-inner">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-zinc-950">{user.name}</h2>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 justify-center">
                <Mail className="h-3.5 w-3.5" />
                <span>{user.email}</span>
              </p>
              
              <div className="w-full border-t border-zinc-100 mt-6 pt-6 flex items-center gap-2 text-xs text-zinc-400 justify-center">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={() => void logout()}
              className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 text-sm font-semibold text-red-700 shadow-sm transition-all hover:bg-red-50 hover:text-red-800"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out Account</span>
            </button>
          </div>

          {/* Right panel: Statistics */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-zinc-100 bg-white p-6 md:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-950 border-b border-zinc-50 pb-4 mb-6 flex items-center gap-2">
                <Compass className="h-5 w-5 text-indigo-600 animate-spin-slow" />
                <span>Your Travel Analytics</span>
              </h3>

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Total Trips */}
                <div className="rounded-xl bg-zinc-50 p-5 border border-zinc-100 flex flex-col justify-between">
                  <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Map className="h-4 w-4 text-indigo-500" />
                    <span>Total Trips</span>
                  </div>
                  <h4 className="text-3xl font-black text-zinc-950 mt-4">{stats.count}</h4>
                </div>

                {/* Allocated Budgets */}
                <div className="rounded-xl bg-zinc-50 p-5 border border-zinc-100 flex flex-col justify-between">
                  <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    <span>Total Budgets</span>
                  </div>
                  <h4 className="text-2xl font-black text-zinc-950 mt-4 leading-tight truncate">{formatCurrency(stats.totalBudget)}</h4>
                </div>

                {/* Avg Duration */}
                <div className="rounded-xl bg-zinc-50 p-5 border border-zinc-100 flex flex-col justify-between">
                  <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>Avg. Duration</span>
                  </div>
                  <h4 className="text-3xl font-black text-zinc-950 mt-4">{stats.avgDuration} days</h4>
                </div>
              </div>

              {/* Travel Summary list */}
              <div className="border-t border-zinc-100 pt-6 mt-8 space-y-4">
                <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                  <ListTodo className="h-4.5 w-4.5 text-zinc-400" />
                  <span>Trip Destinations Planned</span>
                </h4>
                
                {data && data.trips.length === 0 ? (
                  <p className="text-sm text-zinc-400 italic">No trips planned yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {data?.trips.map((t, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 border border-zinc-200">
                        <Sparkles className="h-3 w-3 text-indigo-500" />
                        {t.destination}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
