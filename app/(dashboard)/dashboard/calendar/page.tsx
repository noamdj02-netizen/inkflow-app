import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getCalendarBookingsForCurrentUser } from '@/lib/calendar-data';
import { DashboardCalendarSkeleton } from '@/components/dashboard/DashboardPageSkeletons';

const CalendarViewSoftUI = dynamic(
  () =>
    import('@/components/dashboard/CalendarViewSoftUI').then((m) => ({
      default: m.CalendarViewSoftUI,
    })),
  { ssr: true }
);

export default async function DashboardCalendarPage() {
  let initialBookings: Awaited<ReturnType<typeof getCalendarBookingsForCurrentUser>> = [];
  try {
    initialBookings = (await getCalendarBookingsForCurrentUser()) ?? [];
  } catch {
    initialBookings = [];
  }

  return (
    <Suspense fallback={<DashboardCalendarSkeleton />}>
      <CalendarViewSoftUI initialBookings={initialBookings} />
    </Suspense>
  );
}
