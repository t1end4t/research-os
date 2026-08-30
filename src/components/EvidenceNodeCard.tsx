import { EvidenceItem } from '../types';
import { FileText, FlaskConical } from 'lucide-react';
import { setResearchItemDragData } from '../researchItemDrag';

interface EvidenceNodeCardProps {
  key?: string;
  evidence: EvidenceItem;
  isHighlighted?: boolean;
}

export function EvidenceNodeCard({ evidence, isHighlighted }: EvidenceNodeCardProps) {
  const isPaper = evidence.kind === 'paper';
  const isExperiment = evidence.kind === 'experiment';

  // Status chip styling for experiments
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-[#f0f0f0] dark:bg-[#1a2536] text-[#3b82f6] dark:text-[#60a5fa] border border-[#e0e0e0] dark:border-[#25354e]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1" />
            running
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-[#e6f6f1] dark:bg-[#0f2e24] text-[#10a37f] dark:text-[#34d399] border border-[#d2f0e6] dark:border-[#174637]">
            done
          </span>
        );
      case 'planned':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-[#f0f0f0] dark:bg-[#262626] text-[#6b6b6b] dark:text-[#a3a3a3] border border-[#e0e0e0] dark:border-[#383838]">
            planned
          </span>
        );
    }
  };

  // Empty / placeholder evidence node (GHOST)
  if (evidence.isEmpty) {
    return (
      <div
        id={`evidence-node-${evidence.id}`}
        className={`rounded-[10px] border border-dashed p-3 transition-all duration-300 bg-transparent ${
          isHighlighted
            ? 'border-[#ffb000] ring-2 ring-[#ffb000]'
            : 'border-[#d1d1d1] dark:border-[#333333] text-[#a1a1a1] dark:text-[#666666]'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 opacity-40 text-[#a1a1a1] dark:text-[#666666]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a1a1a1] dark:text-[#666666]">
              {evidence.typeLabel || 'EXPERIMENT'}
            </span>
          </div>
          {evidence.status && getStatusBadge(evidence.status)}
        </div>
        <p className="text-[13px] italic leading-relaxed text-[#a1a1a1] dark:text-[#666666]">
          {evidence.placeholderText || 'none yet'}
        </p>
      </div>
    );
  }

  // Populated paper or experiment node
  const containerClasses = isPaper
    ? 'bg-[#F1F8F9] dark:bg-[#2A6E77]/12 ' +
      (isHighlighted
        ? 'border-2 border-[#ffb000] ring-2 ring-[#ffb000]'
        : 'border border-[#D5EAED] dark:border-[#2A6E77]/25 hover:border-[#2A6E77]/50')
    : 'bg-[#FFF6EE] dark:bg-[#A45A1E]/12 ' +
      (isHighlighted
        ? 'border-2 border-[#ffb000] ring-2 ring-[#ffb000]'
        : 'border border-[#F6E3D2] dark:border-[#A45A1E]/25 hover:border-[#A45A1E]/50');

  const dotColorClass = isPaper
    ? 'bg-[#2A6E77] dark:bg-[#6CD0DE]'
    : 'bg-[#A45A1E] dark:bg-[#F4A86A]';

  const labelColorClass = isPaper
    ? 'text-[#2A6E77] dark:text-[#6CD0DE]'
    : 'text-[#A45A1E] dark:text-[#F4A86A]';

  return (
    <div
      id={`evidence-node-${evidence.id}`}
      draggable={isPaper || isExperiment}
      onDragStart={(event) => {
        setResearchItemDragData(event.dataTransfer, {
          id: evidence.id,
          type: isPaper ? 'PAPER' : 'EXPERIMENT',
          label: evidence.title,
        });
      }}
      className={`rounded-[10px] p-3 transition-all duration-300 ${isPaper || isExperiment ? 'cursor-grab active:cursor-grabbing' : ''} ${containerClasses}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass} shrink-0`} />
          {isPaper ? (
            <FileText className={`w-3.5 h-3.5 ${labelColorClass} opacity-80`} />
          ) : (
            <FlaskConical className={`w-3.5 h-3.5 ${labelColorClass} opacity-80`} />
          )}
          <span className={`text-[10px] font-bold uppercase tracking-wider ${labelColorClass}`}>
            {evidence.typeLabel || (isPaper ? 'PAPER' : 'EXPERIMENT')}
          </span>
        </div>

        {isExperiment && evidence.status && getStatusBadge(evidence.status)}
      </div>

      <p className="text-[13px] font-normal text-[#1a1a1a] dark:text-[#ececec] leading-snug">
        {evidence.title}
      </p>

      {isPaper && evidence.citation && (
        <div className="mt-1 text-[12px] text-[#6b6b6b] dark:text-[#888888]">
          <span>{evidence.citation}</span>
        </div>
      )}

      <div className={`mt-2 text-[11px] leading-snug ${evidence.userReason ? 'text-[#6b6b6b] dark:text-[#999]' : 'text-rose-600 dark:text-rose-400'}`}>
        {evidence.userReason ? `Reason: ${evidence.userReason}` : 'Reason missing — this link cannot be checked.'}
      </div>
    </div>
  );
}
