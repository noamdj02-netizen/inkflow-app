'use client';

import { Suspense } from 'react';
import { DashboardRequests } from '@/components/dashboard/DashboardRequests';
import { DashboardRequestsSkeleton } from '@/components/dashboard/DashboardPageSkeletons';

export default function DashboardRequestsPage() {
  return (
    <Suspense fallback={<DashboardRequestsSkeleton />}>
      <DashboardRequests />
    </Suspense>
  );
}
