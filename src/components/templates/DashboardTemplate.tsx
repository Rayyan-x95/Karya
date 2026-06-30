import React from 'react';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Feedback';
import { Section } from '../ui/Section';
import { Metric } from '../ui/Card';
import { useDashboard } from '../../hooks/useDashboard';

interface DashboardTemplateProps {
  workspaceId: string;
  profileId: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string, desc?: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const ACTION_LABELS: Record<string, { title: string; description: string }> = {
  'Proposal Sent': { title: 'Waiting for proposal response', description: 'Clients reviewing your proposals' },
  'Contract Sent': { title: 'Awaiting contract signature', description: 'Contracts sent, pending client approval' },
  'In Progress': { title: 'Active deliverables', description: 'Projects currently in production' },
  'Invoice Shared': { title: 'Awaiting payment', description: 'Invoices sent, payment pending' },
};

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  workspaceId,
  profileId,
}) => {
  const { metrics, isLoading } = useDashboard(workspaceId, profileId);

  if (isLoading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Spinner size="lg" />
        <span className="text-small text-muted-foreground">Loading your workspace...</span>
      </div>
    );
  }

  const actionItems = metrics.pipeline.filter(p => p.count > 0);
  const hasActions = actionItems.length > 0;

  return (
    <div className="space-y-10">
      {/* Workspace greeting */}
      <header>
        <p className="text-label m-0 mb-2">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="text-display text-foreground m-0">
          {getGreeting()}, {metrics.profileName.split(' ')[0]}
        </h1>
        <p className="text-body text-muted-foreground mt-2 m-0 max-w-lg">
          {hasActions
            ? `You have ${actionItems.reduce((s, i) => s + i.count, 0)} items that need your attention.`
            : 'Your workspace is clear. Time to focus on the work that matters.'}
        </p>
      </header>

      {/* Action queue — what to do next */}
      <Section
        title="Needs attention"
        description={hasActions ? undefined : 'Nothing urgent right now'}
      >
        {hasActions ? (
          <ul className="divide-y divide-border-subtle m-0 p-0 list-none">
            {actionItems.map(item => {
              const meta = ACTION_LABELS[item.label] ?? { title: item.label, description: '' };
              return (
                <li key={item.label} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-body font-medium text-foreground m-0">{meta.title}</p>
                    <p className="text-small text-muted-foreground mt-0.5 m-0">{meta.description}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-display text-2xl font-semibold text-foreground tabular-nums">{item.count}</span>
                    <Badge variant={item.variant} size="sm">{item.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-body text-muted-foreground m-0 py-2">
            All proposals, contracts, and invoices are up to date.
          </p>
        )}
      </Section>

      {/* Compact metrics — no card boxes */}
      <Section title="Overview" divider>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
          <Metric
            label="Active projects"
            value={String(metrics.activeProjects)}
            hint="In your pipeline"
          />
          <Metric
            label="Outstanding"
            value={`₹${metrics.outstanding.toLocaleString('en-IN')}`}
            hint="Unpaid invoices"
          />
          <Metric
            label="Earned this month"
            value={`₹${metrics.earnedThisMonth.toLocaleString('en-IN')}`}
            hint="Collected payments"
          />
          <Metric
            label="Clients"
            value={String(metrics.totalClients)}
            hint="Active relationships"
          />
        </div>
      </Section>

      {/* Recent activity timeline */}
      <Section title="Recently updated" divider>
        {metrics.activities.length === 0 ? (
          <p className="text-body text-muted-foreground m-0 py-2">No recent activity. Actions you take will appear here.</p>
        ) : (
          <ul className="space-y-0 m-0 p-0 list-none">
            {metrics.activities.map((a, idx) => (
              <li
                key={a.id}
                className={`flex items-start gap-4 py-3.5 ${idx > 0 ? 'section-divider' : ''}`}
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-body text-foreground m-0">{a.action}</p>
                  {(a.details?.name || a.details?.clientId || a.details?.status) && (
                    <p className="text-small text-muted-foreground mt-0.5 m-0 truncate">
                      {a.details?.name || a.details?.clientId || a.details?.status}
                    </p>
                  )}
                </div>
                <time className="text-[11px] text-muted-foreground font-mono shrink-0 tabular-nums">
                  {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};
