import { LinkStatus } from '../types';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface LinkStatusChipProps {
  status: LinkStatus;
}

export function LinkStatusChip({ status }: LinkStatusChipProps) {
  const configs: Record<LinkStatus, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
    holds: {
      label: 'holds',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      icon: CheckCircle2,
    },
    weak: {
      label: 'weak',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/60',
      icon: AlertTriangle,
    },
    missing: {
      label: 'missing',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/60',
      icon: XCircle,
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div
      id={`link-status-chip-${status}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} shadow-2xs`}
    >
      <Icon className="w-3 h-3 stroke-[2.2]" />
      <span className="capitalize font-mono text-[11px]">{config.label}</span>
    </div>
  );
}
