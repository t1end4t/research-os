import React, { useState } from 'react';
import { ClaimNode, ClaimVersion, LinkHistoryEvent } from '../../types';
import { Button, SectionLabel } from '../ui/instrument';
import { History, ChevronDown, ChevronUp, RotateCcw, Clock, ShieldCheck, GitCommit } from 'lucide-react';

interface ClaimHistorySectionProps {
  claim: ClaimNode;
  onRestoreVersion: (version: ClaimVersion) => void;
}

export function ClaimHistorySection({
  claim,
  onRestoreVersion,
}: ClaimHistorySectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const versions: ClaimVersion[] = claim.history || [
    {
      versionNumber: 1,
      versionLabel: 'v1',
      timestamp: 'initial',
      createdAt: Date.now(),
      claimText: claim.text,
      note: 'Initial formulation of claim.',
    },
  ];

  const linkEvents: LinkHistoryEvent[] = claim.linkEvents || [];

  // Default display: latest 3 versions, expandable to show all versions and link events
  const displayedVersions = isExpanded ? versions : versions.slice(0, 3);

  return (
    <section
      id="workbench-claim-history-section"
      className="space-y-4 pt-6 pb-8 border-t border-rule/70"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-ink-muted" />
          <SectionLabel mono className="text-[11px] text-ink font-medium">
            HISTORY · {versions.length}{' '}
            {versions.length === 1 ? 'version' : 'versions'}
            {linkEvents.length > 0 && ` · ${linkEvents.length} events`}
          </SectionLabel>
        </div>

        {(versions.length > 3 || linkEvents.length > 0) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted hover:text-ink transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Collapse history' : 'Expand full history'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      <div className="p-4 bg-surface border border-rule rounded-[2px] space-y-4">
        {/* Version list */}
        <div className="space-y-3">
          {displayedVersions.map((ver, idx) => {
            const isCurrent = idx === 0;

            return (
              <div
                key={ver.versionLabel || idx}
                className={`p-3 rounded-[2px] transition-colors ${
                  isCurrent
                    ? 'bg-paper border border-rule shadow-2xs'
                    : 'bg-paper/40 border border-rule/50 text-ink-muted/90'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1.5 border-b border-rule/40 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        isCurrent ? 'text-ink' : 'text-ink-muted'
                      }`}
                    >
                      {ver.versionLabel || `v${ver.versionNumber}`}
                    </span>
                    <span className="text-ink-muted/80">·</span>
                    <span className="text-ink-muted">{ver.timestamp}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 bg-holds/10 text-holds border border-holds/30 text-[9px] uppercase tracking-wider font-medium rounded-[2px]">
                        current
                      </span>
                    )}
                    {ver.trigger && (
                      <span className="text-ink-muted/80 text-[10px]">
                        [{ver.trigger}]
                      </span>
                    )}
                  </div>

                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => onRestoreVersion(ver)}
                      className="text-[11px] h-6 px-2 text-ink hover:bg-surface flex items-center gap-1"
                      title="Restore earlier wording as a new version with required reason"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore as new version
                    </Button>
                  )}
                </div>

                <div className="pt-2 space-y-1">
                  <p
                    className={`font-serif text-[15px] leading-snug ${
                      isCurrent ? 'text-ink font-normal' : 'text-ink-muted'
                    }`}
                  >
                    {ver.claimText}
                  </p>
                  {ver.note && (
                    <p className="text-[12px] font-sans text-ink-muted italic leading-relaxed">
                      Reason for change: {ver.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Link Events (shown when expanded or if there are recent events) */}
        {isExpanded && linkEvents.length > 0 && (
          <div className="pt-3 border-t border-rule/50 space-y-2">
            <span className="block text-[10px] font-mono text-ink-muted uppercase tracking-wider">
              LINK EVENTS & CHECK AUDIT LOG
            </span>
            <div className="space-y-1.5 font-mono text-[11px] text-ink-muted">
              {linkEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start gap-2 py-1 px-2 bg-paper/50 rounded-[2px] border border-rule/30"
                >
                  <Clock className="w-3 h-3 mt-0.5 text-ink-muted/70 shrink-0" />
                  <div className="flex-1">
                    <span className="text-ink-muted/80 mr-2">
                      {evt.timestamp}
                    </span>
                    <span className="text-ink">{evt.summary}</span>
                    {evt.userNote && (
                      <div className="text-[10px] font-sans text-ink-muted italic pt-0.5">
                        Note: {evt.userNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
