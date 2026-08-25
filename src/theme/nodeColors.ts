// Node Type Color Palette and Styling Configuration

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
  // CSS class combinations for Tailwind
  containerClasses: string;
  labelClasses: string;
  dotClasses: string;
}

export const NODE_PALETTE: Record<Exclude<NodeType, 'GHOST'>, NodeTypeTheme> = {
  QUESTION: {
    type: 'QUESTION',
    displayName: 'Question',
    light: {
      bg: '#F5F2FF',
      label: '#6B4FBB',
      border: '#E4DCFA',
      dot: '#6B4FBB',
    },
    dark: {
      bg: 'rgba(107, 79, 187, 0.12)',
      label: '#BCA8F7',
      border: 'rgba(107, 79, 187, 0.25)',
      dot: '#BCA8F7',
    },
    containerClasses:
      'bg-[#F5F2FF] dark:bg-[#6B4FBB]/12 border-[#E4DCFA] dark:border-[#6B4FBB]/25',
    labelClasses: 'text-[#6B4FBB] dark:text-[#BCA8F7]',
    dotClasses: 'bg-[#6B4FBB] dark:bg-[#BCA8F7]',
  },
  CLAIM: {
    type: 'CLAIM',
    displayName: 'Claim',
    light: {
      bg: '#EFF5FF',
      label: '#2C5EA8',
      border: '#DBE7F8',
      dot: '#2C5EA8',
    },
    dark: {
      bg: 'rgba(44, 94, 168, 0.12)',
      label: '#7DB4F8',
      border: 'rgba(44, 94, 168, 0.25)',
      dot: '#7DB4F8',
    },
    containerClasses:
      'bg-[#EFF5FF] dark:bg-[#2C5EA8]/12 border-[#DBE7F8] dark:border-[#2C5EA8]/25',
    labelClasses: 'text-[#2C5EA8] dark:text-[#7DB4F8]',
    dotClasses: 'bg-[#2C5EA8] dark:bg-[#7DB4F8]',
  },
  PAPER: {
    type: 'PAPER',
    displayName: 'Paper',
    light: {
      bg: '#F1F8F9',
      label: '#2A6E77',
      border: '#D5EAED',
      dot: '#2A6E77',
    },
    dark: {
      bg: 'rgba(42, 110, 119, 0.12)',
      label: '#6CD0DE',
      border: 'rgba(42, 110, 119, 0.25)',
      dot: '#6CD0DE',
    },
    containerClasses:
      'bg-[#F1F8F9] dark:bg-[#2A6E77]/12 border-[#D5EAED] dark:border-[#2A6E77]/25',
    labelClasses: 'text-[#2A6E77] dark:text-[#6CD0DE]',
    dotClasses: 'bg-[#2A6E77] dark:bg-[#6CD0DE]',
  },
  EXPERIMENT: {
    type: 'EXPERIMENT',
    displayName: 'Experiment',
    light: {
      bg: '#FFF6EE',
      label: '#A45A1E',
      border: '#F6E3D2',
      dot: '#A45A1E',
    },
    dark: {
      bg: 'rgba(164, 90, 30, 0.12)',
      label: '#F4A86A',
      border: 'rgba(164, 90, 30, 0.25)',
      dot: '#F4A86A',
    },
    containerClasses:
      'bg-[#FFF6EE] dark:bg-[#A45A1E]/12 border-[#F6E3D2] dark:border-[#A45A1E]/25',
    labelClasses: 'text-[#A45A1E] dark:text-[#F4A86A]',
    dotClasses: 'bg-[#A45A1E] dark:bg-[#F4A86A]',
  },
};

// Saturated link status colors (NEVER CHANGE)
export const STATUS_COLORS = {
  holds: '#10a37f',
  weak: '#ffb000',
  missing: '#ef4444',
} as const;

export function getNodeTheme(type: NodeType): NodeTypeTheme | null {
  if (type === 'GHOST') return null;
  return NODE_PALETTE[type] || null;
}
