import React from 'react';
import type { LucideIcon } from 'lucide-react';

type EmptyStateAction =
  | {
      label: string;
      onClick: () => void;
      variant?: 'primary' | 'secondary';
      disabled?: boolean;
    }
  | {
      label: string;
      href: string;
      variant?: 'primary' | 'secondary';
    };

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

function ActionButton({ action }: { action: EmptyStateAction }) {
  const variant = action.variant ?? 'primary';
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors min-h-[44px]';

  const styles =
    variant === 'primary'
      ? 'bg-white text-black hover:bg-zinc-200'
      : 'glass text-zinc-300 hover:text-white hover:bg-white/10';

  if ('href' in action) {
    return (
      <a href={action.href} className={`${base} ${styles}`} target="_blank" rel="noreferrer">
        {action.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={`${base} ${styles} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {action.label}
    </button>
  );
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 glass rounded-2xl ${className}`}>
      <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="text-zinc-600" size={28} />
      </div>
      <p className="text-lg font-display font-bold text-white mb-2">{title}</p>
      {description && <p className="text-zinc-500 text-sm max-w-md mx-auto">{description}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryAction && <ActionButton action={{ ...primaryAction, variant: 'primary' }} />}
          {secondaryAction && <ActionButton action={{ ...secondaryAction, variant: 'secondary' }} />}
        </div>
      )}
    </div>
  );
};

