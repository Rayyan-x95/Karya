import React, { useEffect, useCallback } from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md', className = '',
}) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-8 w-8' };
  return (
    <svg className={`animate-spin text-muted-foreground ${sizes[size]} ${className}`} fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-secondary ${className}`} aria-hidden="true" />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-surface rounded-lg p-5 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
  </div>
);

export const ProgressBar: React.FC<{
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}> = ({ value, max = 100, label, showPercent = true, variant = 'default' }) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const trackColors = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
  };

  return (
    <div className="space-y-2 w-full">
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-small text-muted-foreground">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-medium text-foreground text-mono">{Math.round(percent)}%</span>}
        </div>
      )}
      <div className="h-1 w-full bg-secondary rounded-full overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${trackColors[variant]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const alertStyles: Record<AlertVariant, { wrapper: string; icon: string; iconPath: string }> = {
  info: {
    wrapper: 'bg-surface text-foreground ring-1 ring-inset ring-border',
    icon: 'text-primary',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  success: {
    wrapper: 'bg-success/8 text-success ring-1 ring-inset ring-success/20',
    icon: 'text-success',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    wrapper: 'bg-warning/8 text-warning ring-1 ring-inset ring-warning/20',
    icon: 'text-warning',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  error: {
    wrapper: 'bg-destructive/8 text-destructive ring-1 ring-inset ring-destructive/20',
    icon: 'text-destructive',
    iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

export const AlertBanner: React.FC<{
  variant?: AlertVariant;
  title: string;
  message?: string;
  onDismiss?: () => void;
}> = ({ variant = 'info', title, message, onDismiss }) => {
  const s = alertStyles[variant];
  return (
    <div className={`flex gap-3 rounded-lg p-4 text-body ${s.wrapper}`} role="alert">
      <svg className={`h-4 w-4 shrink-0 mt-0.5 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.iconPath} />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="font-medium m-0">{title}</p>
        {message && <p className="mt-0.5 opacity-80 m-0 text-small">{message}</p>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 p-0.5 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4 animate-fade-in">
    {icon && (
      <div className="h-12 w-12 rounded-lg bg-surface flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
    )}
    <div className="space-y-1.5 max-w-sm">
      <p className="text-title text-foreground m-0">{title}</p>
      {description && <p className="text-small text-muted-foreground m-0">{description}</p>}
    </div>
    {action}
  </div>
);

export interface Toast {
  id: string;
  message: string;
  description?: string;
  type?: AlertVariant;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { id, message, description, type = 'info', duration = 4000 } = toast;
  const s = alertStyles[type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div className={`flex gap-3 items-start rounded-lg p-4 shadow-lg text-body bg-surface-raised max-w-sm w-full pointer-events-auto ring-1 ring-inset ring-border animate-slide-up ${s.wrapper}`} role="alert">
      <svg className={`h-4 w-4 shrink-0 mt-0.5 ${s.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.iconPath} />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground m-0">{message}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{description}</p>}
      </div>
      <button onClick={() => onDismiss(id)} className="shrink-0 p-0.5 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss toast">
        <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: Toast[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  const dismiss = useCallback((id: string) => onDismiss(id), [onDismiss]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
};

export default Spinner;
