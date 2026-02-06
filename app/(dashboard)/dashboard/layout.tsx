'use client';

import React from 'react';
import { DashboardLayoutNext } from '@/components/dashboard/DashboardLayoutNext';

export default function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutNext>{children}</DashboardLayoutNext>;
}
