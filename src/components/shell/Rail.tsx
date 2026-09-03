import React from 'react';
import {
  GitFork,
  Compass,
  BookOpen,
  FlaskConical
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { SurfaceId } from '../../types';

interface SurfaceItem {
  id: SurfaceId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  activeColor: string;
  accentBar: string;
}

const SURFACES: SurfaceItem[] = [
  {
    id: 'map',
    label: 'Map',
    icon: GitFork,
    description: 'Argument tree and structural links',
    activeColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-200/80 dark:ring-indigo-800/60 shadow-xs shadow-indigo-500/10',
    accentBar: 'bg-indigo-600 dark:bg-indigo-400'
  },
  {
    id: 'survey',
    label: 'Survey',
    icon: Compass,
    description: 'Open-problem notes and candidate clusters',
    activeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 ring-1 ring-amber-200/80 dark:ring-amber-800/60 shadow-xs shadow-amber-500/10',
    accentBar: 'bg-amber-500 dark:bg-amber-400'
  },
  {
    id: 'papers',
    label: 'Papers',
    icon: BookOpen,
    description: 'Reader and evidence capture',
    activeColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 ring-1 ring-teal-200/80 dark:ring-teal-800/60 shadow-xs shadow-teal-500/10',
    accentBar: 'bg-teal-500 dark:bg-teal-400'
  },
  {
    id: 'experiments',
    label: 'Experiments',
    icon: FlaskConical,
    description: 'Claim-centric artifact gallery',
    activeColor: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 ring-1 ring-sky-200/80 dark:ring-sky-800/60 shadow-xs shadow-sky-500/10',
    accentBar: 'bg-sky-500 dark:bg-sky-400'
  }
];

export const Rail: React.FC = () => {
  const { activeSurface, setActiveSurface, setActiveContext } = useWorkspace();

  const handleSelectSurface = (surfaceId: SurfaceId) => {
    setActiveSurface(surfaceId);
    if (surfaceId === 'survey') {
      setActiveContext({
        type: 'survey',
        id: 'survey-field',
        label: 'Survey Field',
        secondaryLabel: 'Open problems and candidate clusters'
      });
    } else if (surfaceId === 'map') {
      setActiveContext({
        type: 'graph',
        id: 'global-graph',
        label: 'Global Graph',
        secondaryLabel: 'Argument tree'
      });
    }
  };

  return (
    <aside
      id="instrument-rail"
      className="w-14 border-r border-[var(--color-rule)] bg-[var(--color-surface)] flex flex-col items-center py-4 justify-between shrink-0 select-none z-10"
    >
      <div className="flex flex-col items-center gap-2.5 w-full px-2">
        {SURFACES.map(surface => {
          const Icon = surface.icon;
          const isActive = activeSurface === surface.id;
          return (
            <button
              key={surface.id}
              id={`rail-btn-${surface.id}`}
              onClick={() => handleSelectSurface(surface.id)}
              title={`${surface.label} — ${surface.description}`}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group ${
                isActive
                  ? `${surface.activeColor} scale-100 font-semibold`
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {isActive && (
                <div className={`absolute -left-[9px] top-2 bottom-2 w-1 rounded-r-full ${surface.accentBar}`} />
              )}
              <Icon className="w-4 h-4" />
              <span className="sr-only">{surface.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center pb-2 text-[9px] font-mono text-[var(--color-ink-muted)] opacity-60 pointer-events-none">
        v0.2
      </div>
    </aside>
  );
};
