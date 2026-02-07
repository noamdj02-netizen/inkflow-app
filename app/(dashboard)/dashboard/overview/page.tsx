'use client';

import { Suspense } from 'react';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { DashboardOverviewSkeleton } from '@/components/dashboard/DashboardPageSkeletons';

export default function DashboardOverviewPage() {
  return (
    <Suspense fallback={<DashboardOverviewSkeleton />}>
      <DashboardOverview />
    </Suspense>
  );
}
