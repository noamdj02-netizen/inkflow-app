'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DashboardFlashsSkeleton } from '@/components/dashboard/DashboardPageSkeletons';

const DashboardFlashs = dynamic(
  () =>
    import('@/components/dashboard/DashboardFlashs').then((m) => ({
      default: m.DashboardFlashs,
    })),
  { ssr: true }
);

export default function DashboardFlashsPage() {
  return (
    <Suspense fallback={<DashboardFlashsSkeleton />}>
      <DashboardFlashs />
    </Suspense>
  );
}
