import {
  QuestionNode,
  ClaimNode,
  EvidenceItem,
  ExperimentGroup,
  ArtifactItem,
  DraftManuscript,
  DraftSection,
  DraftPlacedReference,
  DraftPlacedArtifact,
  LinkStatus,
} from '../types';

export interface DraftGapItem {
  id: string;
  type:
    | 'purpose_unwritten'
    | 'no_claim_connected'
    | 'claim_has_no_evidence'
    | 'reason_unwritten'
    | 'link_never_checked'
    | 'weak_link'
    | 'missing_support'
    | 'type_mismatch'
    | 'scope_mismatch'
    | 'target_mismatch'
    | 'experiment_incomplete'
    | 'result_unrecorded'
    | 'contradicting_not_placed'
    | 'claim_drift'
    | 'finding_drift'
    | 'referenced_item_missing';
  label: string;
  detail: string;
  sectionId?: string;
  sectionTitle?: string;
  claimId?: string;
  evidenceId?: string;
  artifactId?: string;
  experimentId?: string;
  severity: 'red' | 'amber' | 'neutral';
}

export interface SectionAnalysis {
  sectionId: string;
  linkedClaims: ClaimNode[];
  placedEvidenceItems: { ref: DraftPlacedReference; evidence: EvidenceItem; parentClaim?: ClaimNode }[];
  placedArtifacts: { placed: DraftPlacedArtifact; artifact?: ArtifactItem; experiment?: ExperimentGroup; parentClaim?: ClaimNode }[];
  isPurposeUnwritten: boolean;
  hasClaimDrift: boolean;
  driftItems: { ref: DraftPlacedReference; claim: ClaimNode; placedVersion: number; currentVersion: number }[];
  gaps: DraftGapItem[];
}

/**
 * Get all claims across questions.
 */
export function getAllClaims(questions: QuestionNode[]): ClaimNode[] {
  const list: ClaimNode[] = [];
  questions.forEach((q) => {
    if (q.claims) {
      q.claims.forEach((c) => list.push(c));
    }
  });
  return list;
}

/**
 * Find parent question of a claim.
 */
export function getParentQuestion(questions: QuestionNode[], claimId: string): QuestionNode | undefined {
  return questions.find((q) => q.claims?.some((c) => c.id === claimId));
}

/**
 * Find claim by ID.
 */
export function findClaimById(questions: QuestionNode[], claimId: string): ClaimNode | undefined {
  for (const q of questions) {
    const found = q.claims?.find((c) => c.id === claimId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Find evidence by ID and its parent claim.
 */
export function findEvidenceById(
  questions: QuestionNode[],
  evidenceId: string
): { evidence: EvidenceItem; parentClaim: ClaimNode } | undefined {
  for (const q of questions) {
    for (const c of q.claims || []) {
      const ev = c.evidence?.find((e) => e.id === evidenceId);
      if (ev) return { evidence: ev, parentClaim: c };
    }
  }
  return undefined;
}

/**
 * Find artifact by ID and its parent experiment.
 */
export function findArtifactById(
  experiments: ExperimentGroup[],
  artifactId: string
): { artifact: ArtifactItem; experiment: ExperimentGroup } | undefined {
  for (const exp of experiments) {
    const art = exp.artifacts?.find((a) => a.id === artifactId);
    if (art) return { artifact: art, experiment: exp };
  }
  return undefined;
}

/**
 * Determines whether a finding is contrary/contradicting to its claim.
 */
export function isContraryFinding(evidence: EvidenceItem): boolean {
  if (evidence.checkResult) {
    const hasMismatch = evidence.checkResult.axes?.some((a) => a.verdict === 'mismatch');
    if (hasMismatch) return true;
    if (evidence.checkResult.finding?.toLowerCase().includes('mismatch')) return true;
    if (evidence.checkResult.finding?.toLowerCase().includes('narrower')) return true;
  }
  // Check title/reason heuristics for known contrary findings
  if (evidence.title.toLowerCase().includes('narrower') || evidence.title.toLowerCase().includes('contrast')) {
    return true;
  }
  return false;
}

/**
 * Analyze a single section.
 */
export function analyzeSection(
  section: DraftSection,
  questions: QuestionNode[],
  experiments: ExperimentGroup[],
  allManuscriptSections: DraftSection[]
): SectionAnalysis {
  const linkedClaimsMap = new Map<string, ClaimNode>();
  const driftItems: { ref: DraftPlacedReference; claim: ClaimNode; placedVersion: number; currentVersion: number }[] = [];
  const placedEvidenceItems: { ref: DraftPlacedReference; evidence: EvidenceItem; parentClaim?: ClaimNode }[] = [];
  const placedArtifactsList: { placed: DraftPlacedArtifact; artifact?: ArtifactItem; experiment?: ExperimentGroup; parentClaim?: ClaimNode }[] = [];
  const gaps: DraftGapItem[] = [];

  const isPurposeUnwritten = !section.purpose || section.purpose.trim() === '';
  if (isPurposeUnwritten) {
    gaps.push({
      id: `gap-purpose-${section.id}`,
      type: 'purpose_unwritten',
      label: 'Purpose unwritten',
      detail: `Section "${section.title}" does not specify what it must establish.`,
      sectionId: section.id,
      sectionTitle: section.title,
      severity: 'amber',
    });
  }

  // 1. Process placed references
  for (const ref of section.placedReferences || []) {
    if (ref.targetType === 'claim') {
      const claim = findClaimById(questions, ref.targetId);
      if (claim) {
        linkedClaimsMap.set(claim.id, claim);
        const currentVer = claim.version ?? 1;
        const placedVer = typeof ref.placedVersion === 'number' ? ref.placedVersion : currentVer;
        if (placedVer < currentVer) {
          driftItems.push({ ref, claim, placedVersion: placedVer, currentVersion: currentVer });
          gaps.push({
            id: `gap-drift-${ref.id}`,
            type: 'claim_drift',
            label: 'Claim changed since added',
            detail: `Claim was placed at v${placedVer}, but research graph is now at v${currentVer}.`,
            sectionId: section.id,
            sectionTitle: section.title,
            claimId: claim.id,
            severity: 'amber',
          });
        }
      } else {
        gaps.push({
          id: `gap-missing-claim-${ref.id}`,
          type: 'referenced_item_missing',
          label: 'Referenced item no longer available',
          detail: `Claim ${ref.targetId} could not be found in active graph.`,
          sectionId: section.id,
          sectionTitle: section.title,
          claimId: ref.targetId,
          severity: 'red',
        });
      }
    } else if (ref.targetType === 'evidence') {
      const found = findEvidenceById(questions, ref.targetId);
      if (found) {
        placedEvidenceItems.push({ ref, evidence: found.evidence, parentClaim: found.parentClaim });
        linkedClaimsMap.set(found.parentClaim.id, found.parentClaim);
      } else {
        gaps.push({
          id: `gap-missing-ev-${ref.id}`,
          type: 'referenced_item_missing',
          label: 'Referenced item no longer available',
          detail: `Evidence finding ${ref.targetId} could not be found in active graph.`,
          sectionId: section.id,
          sectionTitle: section.title,
          evidenceId: ref.targetId,
          severity: 'red',
        });
      }
    }
  }

  // 2. Process placed artifacts
  for (const placed of section.placedArtifacts || []) {
    const found = findArtifactById(experiments, placed.artifactId);
    if (found) {
      const parentClaim = findClaimById(questions, found.artifact.claimId);
      placedArtifactsList.push({
        placed,
        artifact: found.artifact,
        experiment: found.experiment,
        parentClaim,
      });
      if (parentClaim) {
        linkedClaimsMap.set(parentClaim.id, parentClaim);
      }
    }
  }

  const linkedClaims = Array.from(linkedClaimsMap.values());

  // Check if section has no connected claim
  if (linkedClaims.length === 0) {
    gaps.push({
      id: `gap-no-claim-${section.id}`,
      type: 'no_claim_connected',
      label: 'No claim connected',
      detail: `This section does not reference any claim from the research graph.`,
      sectionId: section.id,
      sectionTitle: section.title,
      severity: 'neutral',
    });
  }

  // 3. Check defects on connected claims & placed items
  for (const claim of linkedClaims) {
    // Check if claim has no evidence (e.g. rejected or ghost)
    if (!claim.evidence || claim.evidence.length === 0) {
      gaps.push({
        id: `gap-no-evidence-${claim.id}-${section.id}`,
        type: 'claim_has_no_evidence',
        label: 'Claim has no evidence',
        detail: `Claim "${claim.text.slice(0, 50)}..." has no supporting findings in the graph.`,
        sectionId: section.id,
        sectionTitle: section.title,
        claimId: claim.id,
        severity: 'red',
      });
    }

    // Check link status of claim
    if (claim.linkStatus === 'weak') {
      gaps.push({
        id: `gap-weak-claim-${claim.id}-${section.id}`,
        type: 'weak_link',
        label: 'Weak link on claim',
        detail: `Link from question to claim "${claim.text.slice(0, 50)}..." is weak.`,
        sectionId: section.id,
        sectionTitle: section.title,
        claimId: claim.id,
        severity: 'amber',
      });
    } else if (claim.linkStatus === 'missing') {
      gaps.push({
        id: `gap-missing-claim-${claim.id}-${section.id}`,
        type: 'missing_support',
        label: 'Missing support on claim',
        detail: `Claim "${claim.text.slice(0, 50)}..." is unsupported or missing link.`,
        sectionId: section.id,
        sectionTitle: section.title,
        claimId: claim.id,
        severity: 'red',
      });
    }

    // Check unwritten reason on claim
    if (!claim.check?.reasonText || claim.check.reasonText.trim() === '') {
      gaps.push({
        id: `gap-reason-claim-${claim.id}-${section.id}`,
        type: 'reason_unwritten',
        label: 'Reason unwritten on claim',
        detail: `Claim "${claim.text.slice(0, 50)}..." has no user-written reason for its question link.`,
        sectionId: section.id,
        sectionTitle: section.title,
        claimId: claim.id,
        severity: 'red',
      });
    }

    // Check evidence items under this claim
    for (const ev of claim.evidence || []) {
      // Reason unwritten on finding
      if (!ev.userReason || ev.userReason.trim() === '') {
        gaps.push({
          id: `gap-ev-reason-${ev.id}-${section.id}`,
          type: 'reason_unwritten',
          label: 'Reason unwritten on finding',
          detail: `Finding "${ev.title.slice(0, 50)}..." has no user-written reason (cannot be checked).`,
          sectionId: section.id,
          sectionTitle: section.title,
          claimId: claim.id,
          evidenceId: ev.id,
          severity: 'red',
        });
      }

      // Check results / mismatches
      if (ev.checkResult) {
        for (const axis of ev.checkResult.axes || []) {
          if (axis.verdict === 'mismatch') {
            const gapType =
              axis.label === 'TYPE'
                ? 'type_mismatch'
                : axis.label === 'SCOPE'
                ? 'scope_mismatch'
                : 'target_mismatch';
            gaps.push({
              id: `gap-mismatch-${ev.id}-${axis.label}-${section.id}`,
              type: gapType,
              label: `${axis.label.toLowerCase()} mismatch`.replace(/^\w/, (c) => c.toUpperCase()),
              detail: `Finding "${ev.title.slice(0, 45)}...": ${axis.detail}`,
              sectionId: section.id,
              sectionTitle: section.title,
              claimId: claim.id,
              evidenceId: ev.id,
              severity: 'amber',
            });
          }
        }
      } else if (ev.userReason && ev.userReason.trim() !== '') {
        gaps.push({
          id: `gap-unchecked-${ev.id}-${section.id}`,
          type: 'link_never_checked',
          label: 'Link never checked',
          detail: `Finding "${ev.title.slice(0, 50)}..." has not been checked by model.`,
          sectionId: section.id,
          sectionTitle: section.title,
          claimId: claim.id,
          evidenceId: ev.id,
          severity: 'neutral',
        });
      }
    }
  }

  // 4. Check placed artifacts defects
  for (const item of placedArtifactsList) {
    if (item.experiment) {
      if (item.experiment.status === 'running' || item.experiment.status === 'planned') {
        gaps.push({
          id: `gap-exp-incomplete-${item.placed.id}`,
          type: 'experiment_incomplete',
          label: 'Experiment incomplete',
          detail: `Artifact is from experiment "${item.experiment.name.slice(0, 45)}..." which is still ${item.experiment.status}.`,
          sectionId: section.id,
          sectionTitle: section.title,
          artifactId: item.placed.artifactId,
          experimentId: item.experiment.id,
          severity: 'amber',
        });
      } else if (item.experiment.status === 'done') {
        if (!item.artifact?.findingSummary || item.artifact.findingSummary.trim() === '') {
          gaps.push({
            id: `gap-unrecorded-${item.placed.id}`,
            type: 'result_unrecorded',
            label: 'Result unrecorded',
            detail: `Artifact "${item.artifact?.title || item.placed.artifactId}" has no recorded observation.`,
            sectionId: section.id,
            sectionTitle: section.title,
            artifactId: item.placed.artifactId,
            severity: 'amber',
          });
        }
      }
    }
  }

  return {
    sectionId: section.id,
    linkedClaims,
    placedEvidenceItems,
    placedArtifacts: placedArtifactsList,
    isPurposeUnwritten,
    hasClaimDrift: driftItems.length > 0,
    driftItems,
    gaps,
  };
}

/**
 * Analyze the entire manuscript and return standing metrics and all gaps.
 */
export function analyzeManuscript(
  manuscript: DraftManuscript,
  questions: QuestionNode[],
  experiments: ExperimentGroup[]
): {
  sectionAnalyses: Record<string, SectionAnalysis>;
  allGaps: DraftGapItem[];
  unplacedContradictions: { evidence: EvidenceItem; parentClaim: ClaimNode }[];
  standingCounts: {
    tentativeClaims: number;
    unplacedContradictions: number;
    unwrittenReasons: number;
    openGapsCount: number;
  };
} {
  const sectionAnalyses: Record<string, SectionAnalysis> = {};
  const allGaps: DraftGapItem[] = [];

  // Track all placed claim IDs and evidence IDs across entire manuscript
  const placedClaimIdsAll = new Set<string>();
  const placedEvidenceIdsAll = new Set<string>();

  manuscript.sections.forEach((sec) => {
    sec.placedReferences?.forEach((ref) => {
      if (ref.targetType === 'claim') placedClaimIdsAll.add(ref.targetId);
      if (ref.targetType === 'evidence') placedEvidenceIdsAll.add(ref.targetId);
    });
  });

  // Run section analysis
  manuscript.sections.forEach((sec) => {
    const analysis = analyzeSection(sec, questions, experiments, manuscript.sections);
    sectionAnalyses[sec.id] = analysis;
    allGaps.push(...analysis.gaps);
  });

  // Check contradicting findings under placed claims that are NOT placed anywhere in the draft!
  const unplacedContradictions: { evidence: EvidenceItem; parentClaim: ClaimNode }[] = [];
  placedClaimIdsAll.forEach((cId) => {
    const claim = findClaimById(questions, cId);
    if (claim) {
      claim.evidence?.forEach((ev) => {
        if (isContraryFinding(ev) && !placedEvidenceIdsAll.has(ev.id)) {
          unplacedContradictions.push({ evidence: ev, parentClaim: claim });
          allGaps.push({
            id: `gap-unplaced-contrary-${ev.id}`,
            type: 'contradicting_not_placed',
            label: 'Contradicting finding not placed',
            detail: `Contrary finding "${ev.title.slice(0, 50)}..." under claim "${claim.text.slice(0, 40)}..." is not placed in the manuscript.`,
            claimId: claim.id,
            evidenceId: ev.id,
            severity: 'amber',
          });
        }
      });
    }
  });

  // Standing counts calculation
  let tentativeClaims = 0;
  let unwrittenReasons = 0;
  const allClaims = getAllClaims(questions);
  allClaims.forEach((c) => {
    if (c.linkStatus === 'weak' || c.linkStatus === 'missing') tentativeClaims++;
    if (!c.check?.reasonText || c.check.reasonText.trim() === '') unwrittenReasons++;
    c.evidence?.forEach((ev) => {
      if (!ev.userReason || ev.userReason.trim() === '') unwrittenReasons++;
    });
  });

  return {
    sectionAnalyses,
    allGaps,
    unplacedContradictions,
    standingCounts: {
      tentativeClaims,
      unplacedContradictions: unplacedContradictions.length,
      unwrittenReasons,
      openGapsCount: allGaps.length,
    },
  };
}

/**
 * Generate a next anchor code like C1, E2, F1, T2, N1
 */
export function getNextAnchorCode(
  type: 'claim' | 'evidence' | 'PLOT' | 'TABLE' | 'NOTE',
  existingReferences: DraftPlacedReference[],
  existingArtifacts: DraftPlacedArtifact[]
): string {
  const prefix =
    type === 'claim'
      ? 'C'
      : type === 'evidence'
      ? 'E'
      : type === 'PLOT'
      ? 'F'
      : type === 'TABLE'
      ? 'T'
      : 'N';

  let count = 0;
  if (type === 'claim' || type === 'evidence') {
    count = existingReferences.filter((r) => r.anchorCode.startsWith(prefix)).length;
  } else {
    count = existingArtifacts.filter((a) => a.anchorCode.startsWith(prefix)).length;
  }
  return `${prefix}${count + 1}`;
}
