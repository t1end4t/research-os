// Node Type Styling Configuration and Link Status Palette

export type NodeType = 'QUESTION' | 'CLAIM' | 'PAPER' | 'EXPERIMENT' | 'GHOST';

export interface NodeTypeTheme {
  type: NodeType;
  displayName: string;
  light: {
    bg: string;
    label: string;
    border: string;
    dot: string;
  };
  dark: {
    bg: string;
    label: string;
    border: string;
    dot: string;
  };
  containerClasses: string;
  labelClasses: string;
  dotClasses: string;
}

export const NODE_PALETTE: Record<Exclude<NodeType, 'GHOST'>, NodeTypeTheme> = {
  QUESTION: {
    type: 'QUESTION',
    displayName: 'Question',
    light: {
      bg: 'var(--color-surface)',
      label: 'var(--color-ink)',
      border: 'var(--color-rule)',
      dot: 'var(--color-ink-muted)',
    },
    dark: {
      bg: 'var(--color-surface)',
      label: 'var(--color-ink)',
      border: 'var(--color-rule)',
      dot: 'var(--color-ink-muted)',
    },
    containerClasses:
      'bg-surface border-rule text-ink',
    labelClasses: 'text-ink font-mono text-[10px] uppercase tracking-wider',
    dotClasses: 'bg-ink-muted',
  },
  CLAIM: {
    type: 'CLAIM',
    displayName: 'Claim',
    light: {
      bg: 'var(--color-surface)',
      label: 'var(--color-ink)',
      border: 'var(--color-rule)',
      dot: 'var(--color-ink-muted)',
    },
    dark: {
      bg: 'var(--color-surface)',
      label: 'var(--color-ink)',
      border: 'var(--color-rule)',
      dot: 'var(--color-ink-muted)',
    },
    containerClasses:
      'bg-surface border-rule text-ink',
    labelClasses: 'text-ink font-mono text-[10px] uppercase tracking-wider',
    dotClasses: 'bg-ink-muted',
  },
  PAPER: {
    type: 'PAPER',
    displayName: 'Paper',
    light: {
      bg: 'var(--color-surface)',
      label: 'var(--color-ink-muted)',
      border: 'var(--color-rule)',
      dot: 'var(--color-ink-muted)',
    },
    dark: {
      bg: 'var(--color-surface)',
      label: 'var(--color-ink-muted)',
      border: 'var(--color-rule)',
      dot: 'var(--color-ink-muted)',
    },
    containerClasses:
      'bg-surface border-rule text-ink',
    labelClasses: 'text-ink-muted font-mono text-[10px] uppercase tracking-wider',
    dotClasses: 'bg-ink-muted',
  },
  EXPERIMENT: {
    type: 'EXPERIMENT',
    displayName: 'Experiment',
    light: {
      bg: 'var(--color-surface)',
      label: 'var(--color-ink-muted)',
      border: 'var(--color-rule)',
      dot: 'var(--color-ink-muted)',
    },
    dark: {
      bg: 'var(--color-surface)',
      label: 'var(--color-ink-muted)',
      border: 'var(--color-rule)',
      dot: 'var(--color-ink-muted)',
    },
    containerClasses:
      'bg-surface border-rule text-ink',
    labelClasses: 'text-ink-muted font-mono text-[10px] uppercase tracking-wider',
    dotClasses: 'bg-ink-muted',
  },
};

// Reserved link status colors (green, amber, red reserved exclusively for link status)
export const STATUS_COLORS = {
  holds: 'var(--color-holds)',
  weak: 'var(--color-weak)',
  missing: 'var(--color-missing)',
} as const;

export function getNodeTheme(type: NodeType): NodeTypeTheme | null {
  if (type === 'GHOST') return null;
  return NODE_PALETTE[type] || null;
}

