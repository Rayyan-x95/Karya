import React from 'react';
import { Section } from './Section';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  variant?: 'default' | 'ghost' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'ghost',
}) => {
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };
  const variants = {
    default: 'border border-border-subtle bg-card rounded-lg',
    ghost: 'bg-surface rounded-lg',
    elevated: 'bg-surface-raised rounded-lg shadow-sm',
  };

  return (
    <div className={`${variants[variant]} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};

interface MetricProps {
  label: string;
  value: string;
  hint?: string;
}

export const Metric: React.FC<MetricProps> = ({ label, value, hint }) => (
  <div className="space-y-1">
    <p className="text-label m-0">{label}</p>
    <p className="font-display text-xl font-semibold text-foreground tracking-tight m-0">{value}</p>
    {hint && <p className="text-small text-muted-foreground m-0">{hint}</p>}
  </div>
);

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: { value: string; up: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sublabel, trend }) => (
  <div className="py-4 px-1">
    <Metric label={label} value={value} hint={sublabel} />
    {trend && (
      <span className={`inline-flex items-center gap-1 mt-2 text-small font-medium ${
        trend.up ? 'text-success' : 'text-destructive'
      }`}>
        {trend.up ? '↑' : '↓'} {trend.value}
      </span>
    )}
  </div>
);

interface SummaryCardProps {
  title: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, badge, actions, children }) => (
  <Section
    title={title}
    actions={
      (actions || badge) ? (
        <div className="flex items-center gap-2">
          {badge}
          {actions}
        </div>
      ) : undefined
    }
  >
    {children}
  </Section>
);

export default Card;
