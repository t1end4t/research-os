import { ClaimNode, EvidenceItem, EvidenceKind, ExperimentStatus } from './types';

export interface ClaimDraft {
  text: string;
  userReason: string;
}

export interface EvidenceDraft {
  kind: EvidenceKind;
  title: string;
  userReason: string;
  citation?: string;
  status?: ExperimentStatus;
}

export const splitTags = (value: string) =>
  Array.from(new Set(value.split(',').map((tag) => tag.trim()).filter(Boolean)));

export const canCreateClaim = ({ text, userReason }: ClaimDraft) =>
  Boolean(text.trim() && userReason.trim());

export const canCreateEvidence = ({ title, userReason }: EvidenceDraft) =>
  Boolean(title.trim() && userReason.trim());

export function createClaim(id: string, draft: ClaimDraft): ClaimNode {
  if (!canCreateClaim(draft)) throw new Error('Claim text and user reason are required.');

  return {
    id,
    type: 'CLAIM',
    text: draft.text.trim(),
    linkStatus: 'missing',
    evidence: [],
    check: {
      tag: 'NOT CHECKED',
      tagColor: 'stone',
      reasonText: draft.userReason.trim(),
      explanation: 'This link has not been checked yet.',
      checks: [
        { label: 'Type', status: 'unverified', detail: 'Pending check' },
        { label: 'Scope', status: 'unverified', detail: 'Pending check' },
        { label: 'Target', status: 'unverified', detail: 'Pending check' },
      ],
    },
  };
}

export function createEvidence(id: string, draft: EvidenceDraft): EvidenceItem {
  if (!canCreateEvidence(draft)) throw new Error('Finding and user reason are required.');

  return {
    id,
    kind: draft.kind,
    typeLabel: draft.kind === 'paper' ? 'PAPER' : 'EXPERIMENT',
    title: draft.title.trim(),
    userReason: draft.userReason.trim(),
    citation: draft.kind === 'paper' ? draft.citation?.trim() || undefined : undefined,
    status: draft.kind === 'experiment' ? draft.status || 'planned' : undefined,
  };
}
