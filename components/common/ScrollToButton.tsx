'use client';

import React from 'react';

interface ScrollToButtonProps {
  targetId: string;
  children: React.ReactNode;
  className?: string;
}

export const ScrollToButton: React.FC<ScrollToButtonProps> = ({ targetId, children, className }) => {
  const handleClick = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
};
