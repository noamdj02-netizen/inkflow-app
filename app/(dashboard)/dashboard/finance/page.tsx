'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { DashboardFinanceSkeleton } from '@/components/dashboard/DashboardPageSkeletons';

const DashboardFinance = dynamic(
  () =>
    import('@/components/dashboard/DashboardFinance').then((m) => ({
      default: m.DashboardFinance,
    })),
  { ssr: true }
);

export default function DashboardFinancePage() {
  return (
    <Suspense fallback={<DashboardFinanceSkeleton />}>
      <DashboardFinance />
    </Suspense>
  );
}
