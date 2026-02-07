'use client';

/**
 * Page-level skeletons that mimic the exact layout of dashboard pages.
 * Used as Suspense fallbacks for "butter smooth" loading.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '../common/Skeleton';

/** Finance page: stats cards + transactions list */
export function DashboardFinanceSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      <header className="bg-card/95 backdrop-blur-md border-b border-border shadow-sm px-4 md:px-6 py-4 md:py-5 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-56 hidden md:block" />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Skeleton className="h-[44px] w-40 rounded-xl flex-1 md:flex-none" />
            <Skeleton className="h-[44px] w-32 rounded-xl flex-1 md:flex-none" />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 md:pt-3 pb-24 md:pb-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl md:rounded-2xl p-4 md:p-6 bg-card border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-4 w-12 hidden md:block" />
              </div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl md:rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <div className="p-4 md:p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background/50">
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Requests page: tabs + list of cards */
export function DashboardRequestsSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      <header className="bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-24 md:pb-6 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-sm">
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Calendar page: sidebar + grid */
export function DashboardCalendarSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen flex flex-col md:flex-row gap-4 p-4 pb-24 md:pb-4 bg-background"
    >
      <div className="w-full md:w-[280px] lg:w-[350px] flex-shrink-0 space-y-4">
        <Skeleton className="h-[280px] rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>
        <Skeleton className="flex-1 min-h-[400px] rounded-2xl" />
      </div>
    </motion.div>
  );
}

/** Overview page: KPI row + widget grid */
export function DashboardOverviewSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      <header className="px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-8 w-56" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 md:px-6 pt-2 md:pt-3 pb-24 md:pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card p-4 sm:p-5 min-h-[88px] sm:min-h-[110px] animate-pulse">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-16 mt-4" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-[320px] rounded-2xl" />
          <Skeleton className="h-[320px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Flashs page: grid of flash cards */
export function DashboardFlashsSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      <header className="bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-6 py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-24 md:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border bg-card">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
