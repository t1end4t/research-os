import React from 'react';
import { DraftPlacedReference, ClaimNode } from '../../types';
import { SectionLabel, Button } from '../ui/instrument';
import { Clock, X, Check, ArrowRight } from 'lucide-react';

export interface DraftDriftModalProps {
  reference: DraftPlacedReference;
  claim: ClaimNode;
  onClose: () => void;
  onUseCurrentVersion: (refId: string, currentVersion: number) => void;
}

export function DraftDriftModal({
  reference,
  claim,
  onClose,
  onUseCurrentVersion,
}: DraftDriftModalProps) {
  const currentVer = claim.version ?? 1;
  const placedVer = typeof reference.placedVersion === 'number' ? reference.placedVersion : currentVer;

  // Find historical version matching placedVer if exists
  const historicalVersion = claim.history?.find((h) => h.versionNumber === placedVer);
  const placedText = historicalVersion ? historicalVersion.claimText : `[v${placedVer} text]`;
  const currentText = claim.text;

  return (
    <div
      id="draft-drift-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4 select-none font-sans"
      onClick={onClose}
    >
      <div
        id="draft-drift-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface border border-rule rounded-[2px] shadow-xl flex flex-col gap-4 p-5 text-ink"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[2px] bg-weak/10 text-weak">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-sans text-sm font-semibold text-ink">
                Claim Version Drift
              </h2>
              <p className="text-[11px] font-mono text-ink-muted">
                This claim was modified in the research graph after it was placed in the draft.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-paper rounded text-ink-muted hover:text-ink cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Placed Version */}
          <div className="bg-paper border border-rule rounded-[2px] p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-[10px] text-ink-muted uppercase">
              <span className="font-semibold text-ink">Placed in Draft</span>
              <span>v{placedVer}</span>
            </div>
            <p className="font-serif text-sm text-ink leading-relaxed font-medium">
              {placedText}
            </p>
            {historicalVersion?.note && (
              <p className="text-[11px] font-mono text-ink-muted italic">
                Note: {historicalVersion.note}
              </p>
            )}
          </div>

          {/* Current Graph Version */}
          <div className="bg-paper border border-ink/40 rounded-[2px] p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between font-mono text-[10px] text-ink-muted uppercase">
              <span className="font-semibold text-ink">Active Graph Version</span>
              <span className="text-ink font-bold">v{currentVer} (latest)</span>
            </div>
            <p className="font-serif text-sm text-ink leading-relaxed font-medium">
              {currentText}
            </p>
            {claim.lastEditedTime && (
              <p className="text-[11px] font-mono text-ink-muted">
                {claim.lastEditedTime}
              </p>
            )}
          </div>
        </div>

        {/* Explanation */}
        <div className="text-[11px] font-sans text-ink-muted/90 bg-paper/60 p-2.5 rounded-[2px] border border-rule/50">
          Instrument never automatically rewrites your section prose. You can choose to update the draft reference to acknowledge the new version, or keep the existing referenced version.
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-rule">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            title="Keep draft reference at placed version"
          >
            Keep referenced version (v{placedVer})
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onUseCurrentVersion(reference.id, currentVer);
              onClose();
            }}
            title="Update draft reference to current version v3"
          >
            Use current version (v{currentVer})
          </Button>
        </div>
      </div>
    </div>
  );
}
