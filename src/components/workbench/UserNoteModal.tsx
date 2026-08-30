import React, { useState } from 'react';
import { Button, SectionLabel } from '../ui/instrument';
import { AlertTriangle, X } from 'lucide-react';
import { ClaimVersion } from '../../types';

export type ModalType =
  | 'weaken_claim'
  | 'add_experiment'
  | 'reject_claim'
  | 'unreject_claim'
  | 'dismiss_finding'
  | 'restore_version';

interface UserNoteModalProps {
  isOpen: boolean;
  type: ModalType;
  claimText?: string;
  findingTitle?: string;
  versionToRestore?: ClaimVersion;
  onClose: () => void;
  onSubmit: (data: { textValue?: string; userNote: string; extra?: string }) => void;
}

export function UserNoteModal({
  isOpen,
  type,
  claimText = '',
  findingTitle = '',
  versionToRestore,
  onClose,
  onSubmit,
}: UserNoteModalProps) {
  const [textValue, setTextValue] = useState(
    type === 'weaken_claim'
      ? claimText
      : type === 'add_experiment'
        ? ''
        : ''
  );
  const [userNote, setUserNote] = useState('');

  if (!isOpen) return null;

  const getModalConfig = () => {
    switch (type) {
      case 'weaken_claim':
        return {
          title: 'Weaken / Narrow Claim',
          description:
            'Refine or bound the wording of your claim to resolve a scope or type mismatch. This creates a new version in your history.',
          primaryLabel: 'Commit New Version',
          textInputLabel: 'Updated claim wording',
          textPlaceholder: 'e.g. Sparse coding explains simple-cell receptive fields in V1.',
          noteLabel: 'Why are you weakening or bounding this claim? (Required)',
          notePlaceholder: 'e.g. Narrowed to simple cells after a scope mismatch on complex cell receptive fields.',
        };
      case 'add_experiment':
        return {
          title: 'Add Experiment to Test Claim',
          description:
            'Attach a new experiment finding directly under this claim to test unresolved mechanisms or targets.',
          primaryLabel: 'Create Experiment Finding',
          textInputLabel: 'Experiment finding or manipulation title',
          textPlaceholder: 'e.g. Subspace overlap manipulation across sparsity levels.',
          noteLabel: 'What does this experiment test regarding the claim? (Required)',
          notePlaceholder: 'e.g. Tests whether reducing overlap directly prevents memory interference under fixed sparsity.',
        };
      case 'reject_claim':
        return {
          title: 'Flag Claim as Rejected',
          description:
            'Mark this claim as rejected. The claim, its evidence findings, and all history are preserved as a record of reasoning.',
          primaryLabel: 'Confirm Reject',
          textInputLabel: null,
          textPlaceholder: '',
          noteLabel: 'Why is this claim being rejected? (Required)',
          notePlaceholder: 'e.g. Direct causal tests showed interference persisted despite low activation overlap.',
        };
      case 'unreject_claim':
        return {
          title: 'Reactivate Claim',
          description:
            'Remove the rejected flag from this claim and return it to active investigation.',
          primaryLabel: 'Reactivate Claim',
          textInputLabel: null,
          textPlaceholder: '',
          noteLabel: 'Why are you reactivating this claim? (Required)',
          notePlaceholder: 'e.g. New experimental protocol addresses previous confounding factors.',
        };
      case 'dismiss_finding':
        return {
          title: 'Dismiss Finding from Claim',
          description:
            'Detach this finding from the claim. The finding and your recorded reason will be logged in version history rather than silently erased.',
          primaryLabel: 'Dismiss Finding',
          textInputLabel: null,
          textPlaceholder: '',
          noteLabel: 'Why does this finding not support this claim? (Required)',
          notePlaceholder: 'e.g. Finding measured temporal correlations which cannot isolate spatial receptive-field geometry.',
        };
      case 'restore_version':
        return {
          title: `Restore Version ${versionToRestore?.versionLabel || 'Prior'}`,
          description:
            'Restore earlier wording. Rule: history is never overwritten; restoring creates a new version referencing the old wording.',
          primaryLabel: 'Restore as New Version',
          textInputLabel: null,
          textPlaceholder: '',
          noteLabel: 'Why are you returning to this earlier wording? (Required)',
          notePlaceholder: 'e.g. Reassessing earlier broader scope after new synthetic benchmark results.',
        };
    }
  };

  const config = getModalConfig();
  const isSubmitDisabled = !userNote.trim() || (config.textInputLabel && !textValue.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;
    onSubmit({
      textValue: textValue.trim(),
      userNote: userNote.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="workbench-note-modal"
        className="w-full max-w-lg bg-surface border border-rule shadow-xl rounded-[2px] p-5 text-ink relative"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-rule/60">
          <div>
            <SectionLabel mono className="text-[10px] text-ink-muted block mb-1">
              DELIBERATE COMMITMENT
            </SectionLabel>
            <h2 className="text-[17px] font-sans font-medium text-ink">
              {config.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink hover:bg-paper rounded-[2px] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description / Policy */}
        <div className="my-3 text-[13px] text-ink-muted font-sans leading-relaxed">
          {config.description}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Optional Primary text input (e.g. updated claim wording or experiment name) */}
          {config.textInputLabel && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-ink uppercase tracking-wider">
                {config.textInputLabel}
              </label>
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                rows={2}
                placeholder={config.textPlaceholder}
                className="w-full p-2.5 bg-paper border border-rule rounded-[2px] font-serif text-[15px] text-ink focus:border-ink transition-colors leading-relaxed"
                autoFocus
              />
            </div>
          )}

          {/* If restoring version, show preview */}
          {type === 'restore_version' && versionToRestore && (
            <div className="p-3 bg-paper border border-rule rounded-[2px] space-y-1">
              <div className="text-[10px] font-mono text-ink-muted">
                {versionToRestore.versionLabel} · {versionToRestore.timestamp}
              </div>
              <p className="font-serif text-[14px] text-ink">
                {versionToRestore.claimText}
              </p>
            </div>
          )}

          {/* If dismissing finding, show target finding */}
          {type === 'dismiss_finding' && findingTitle && (
            <div className="p-2.5 bg-paper border border-rule rounded-[2px]">
              <span className="text-[10px] font-mono text-ink-muted block uppercase">
                Target Finding
              </span>
              <p className="font-serif text-[14px] text-ink pt-0.5">
                {findingTitle}
              </p>
            </div>
          )}

          {/* Required User Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono text-missing font-medium uppercase tracking-wider">
                {config.noteLabel}
              </label>
              <span className="text-[10px] font-mono text-ink-muted">
                {userNote.trim().length === 0 ? '! note required' : '✓ logged to history'}
              </span>
            </div>
            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              rows={3}
              placeholder={config.notePlaceholder}
              className="w-full p-2.5 bg-paper border border-rule rounded-[2px] font-sans text-[13px] text-ink focus:border-ink transition-colors leading-relaxed"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-rule/60">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-muted">
              <AlertTriangle className="w-3.5 h-3.5 text-weak shrink-0" />
              <span>Versioned permanently. No silent overwrites.</span>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="quiet" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={type === 'reject_claim' ? 'destructive' : 'primary'}
                disabled={isSubmitDisabled}
              >
                {config.primaryLabel}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
