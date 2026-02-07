'use client';

/**
 * Dashboard template – re-renders on every navigation.
 * Adds subtle page transitions (opacity + slide up) for butter-smooth UX.
 */

import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15 },
  },
};

export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key="dashboard-content"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="flex-1 flex flex-col min-h-0 min-w-0"
    >
      {children}
    </motion.div>
  );
}
