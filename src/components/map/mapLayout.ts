import { QuestionNode, ClaimNode, EvidenceItem, LinkStatus, FilterStatus } from '../../types';
import { StandingSegment } from '../shell/StandingBar';

export interface MapLayoutNodeBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapQuestionNode extends MapLayoutNodeBase {
  type: 'QUESTION';
  question: QuestionNode;
  text: string;
  tags?: string[];
  claimsCount: number;
  unresolvedCount: number;
  weakCount: number;
  missingCount: number;
  childClaimIds: string[];
}

export interface MapClaimNode extends MapLayoutNodeBase {
  type: 'CLAIM';
  claim: ClaimNode;
  questionId: string;
  text: string;
  linkStatus: LinkStatus;
  evidenceCount: number;
  isRejected?: boolean;
  isModelProduced?: boolean;
  childEvidenceIds: string[];
}

export interface MapEvidenceNode extends MapLayoutNodeBase {
  type: 'EVIDENCE';
  evidence: EvidenceItem;
  questionId: string;
  claimId: string;
  kind: 'paper' | 'experiment';
  findingText: string;
  sourceTitle: string;
  linkStatus: LinkStatus;
  isReasonMissing: boolean;
  isModelProduced?: boolean;
}

export interface MapGhostNode extends MapLayoutNodeBase {
  type: 'GHOST';
  ghostKind: 'no_claim' | 'no_evidence';
  questionId: string;
  claimId?: string;
  parentId: string;
  parentType: 'QUESTION' | 'CLAIM';
  title: string;
  message: string;
  linkStatus: LinkStatus;
}

export type MapNode = MapQuestionNode | MapClaimNode | MapEvidenceNode | MapGhostNode;

export interface MapEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType: 'QUESTION' | 'CLAIM';
  targetType: 'CLAIM' | 'EVIDENCE' | 'GHOST';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  busX: number;
  status: LinkStatus;
  questionId: string;
  claimId?: string;
}

export interface MapLayoutResult {
  nodes: MapNode[];
  edges: MapEdge[];
  questionNodes: MapQuestionNode[];
  claimNodes: MapClaimNode[];
  evidenceNodes: MapEvidenceNode[];
  ghostNodes: MapGhostNode[];
  counts: {
    questions: number;
    claims: number;
    evidence: number;
    ghosts: number;
    weak: number;
    missing: number;
    holds: number;
  };
  bounds: {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// Fixed Column Geometry
export const COL_QUESTION_X = 32;
export const COL_QUESTION_W = 300;

export const GUTTER_1_W = 80;
export const COL_CLAIM_X = COL_QUESTION_X + COL_QUESTION_W + GUTTER_1_W; // 412
export const COL_CLAIM_W = 340;

export const GUTTER_2_W = 80;
export const COL_EVIDENCE_X = COL_CLAIM_X + COL_CLAIM_W + GUTTER_2_W; // 832
export const COL_EVIDENCE_W = 360;

export const TOTAL_CANVAS_MIN_WIDTH = COL_EVIDENCE_X + COL_EVIDENCE_W + 48; // 1240px

// Standardized deterministic heights
export const HEIGHT_QUESTION = 96;
export const HEIGHT_CLAIM = 84;
export const HEIGHT_EVIDENCE = 92;
export const HEIGHT_GHOST = 74;

export const SIBLING_GAP = 16;
export const QUESTION_GAP = 56;
export const TOP_OFFSET = 24;

/**
 * Filter questions based on FilterStatus / StandingSegment while strictly preserving necessary ancestors.
 */
export function filterMapQuestions(
  questions: QuestionNode[],
  filter: FilterStatus,
  standingFilter: StandingSegment = 'all',
  onlyMine: boolean = false
): QuestionNode[] {
  // Determine effective filter mode
  let effectiveFilter = filter;
  if (standingFilter === 'weak') effectiveFilter = 'weak';
  else if (standingFilter === 'unsupported') effectiveFilter = 'missing';

  return questions
    .map((q) => {
      // 1. If filtering for open questions (standing: 'open')
      if (standingFilter === 'open') {
        if (q.claims.length === 0) return q;
        return null;
      }

      // 2. If filtering for unwritten reasons (standing: 'unwritten')
      if (standingFilter === 'unwritten') {
        const matchingClaims = q.claims.filter((c) => {
          const claimReasonUnwritten = !c.check?.reasonText || c.check.reasonText.trim() === '';
          const hasUnwrittenEvidence = c.evidence?.some(
            (e) => !e.userReason || e.userReason.trim() === ''
          );
          return claimReasonUnwritten || hasUnwrittenEvidence;
        });

        if (matchingClaims.length === 0) return null;
        return {
          ...q,
          claims: matchingClaims.map((c) => {
            const claimReasonUnwritten = !c.check?.reasonText || c.check.reasonText.trim() === '';
            if (claimReasonUnwritten) return c;
            // keep only evidence with unwritten reason
            const unwrittenEv = c.evidence.filter((e) => !e.userReason || e.userReason.trim() === '');
            return { ...c, evidence: unwrittenEv.length > 0 ? unwrittenEv : c.evidence };
          }),
        };
      }

      // 3. If filtering for holds (standing: 'holds')
      if (standingFilter === 'holds') {
        const matchingClaims = q.claims.filter((c) => {
          return c.linkStatus === 'holds' || c.evidence?.some((e) => (e as any).linkStatus === 'holds' || c.linkStatus === 'holds');
        });
        if (matchingClaims.length === 0) return null;
        return {
          ...q,
          claims: matchingClaims,
        };
      }

      // 4. Weak only
      if (effectiveFilter === 'weak') {
        const matchingClaims = q.claims.filter((c) => {
          const isClaimWeak = c.linkStatus === 'weak';
          const hasWeakEvidence = c.evidence?.some((e) => (e as any).linkStatus === 'weak');
          return isClaimWeak || hasWeakEvidence;
        });
        if (matchingClaims.length === 0) return null;
        return {
          ...q,
          claims: matchingClaims,
        };
      }

      // 5. Missing only
      if (effectiveFilter === 'missing') {
        // Questions with no claims are missing branches
        if (q.claims.length === 0) return q;

        const matchingClaims = q.claims.filter((c) => {
          const isClaimMissing = c.linkStatus === 'missing';
          const hasNoEvidence = !c.evidence || c.evidence.length === 0;
          const isReasonUnwritten = !c.check?.reasonText || c.check.reasonText.trim() === '';
          const hasMissingEvidence = c.evidence?.some(
            (e) => (e as any).linkStatus === 'missing' || !e.userReason || e.userReason.trim() === ''
          );
          return isClaimMissing || hasNoEvidence || isReasonUnwritten || hasMissingEvidence;
        });

        if (matchingClaims.length === 0) return null;
        return {
          ...q,
          claims: matchingClaims,
        };
      }

      // 6. All
      return q;
    })
    .filter((q): q is QuestionNode => q !== null);
}

/**
 * Deterministically computes 3-column argument layout with orthogonal elbow connections.
 */
export function computeMapLayout(
  questions: QuestionNode[]
): MapLayoutResult {
  const nodes: MapNode[] = [];
  const edges: MapEdge[] = [];
  const questionNodes: MapQuestionNode[] = [];
  const claimNodes: MapClaimNode[] = [];
  const evidenceNodes: MapEvidenceNode[] = [];
  const ghostNodes: MapGhostNode[] = [];

  let currentY = TOP_OFFSET;
  let totalEvidenceCount = 0;
  let totalClaimCount = 0;
  let holdsCount = 0;
  let weakCount = 0;
  let missingCount = 0;
  let ghostCount = 0;

  questions.forEach((q) => {
    // QUESTION WITH NO CLAIMS -> Renders Question + Ghost Claim in Col 2
    if (!q.claims || q.claims.length === 0) {
      const qTopY = currentY;
      const ghostId = `ghost-claim-${q.id}`;
      const ghostTopY = qTopY + (HEIGHT_QUESTION - HEIGHT_GHOST) / 2;

      const qNode: MapQuestionNode = {
        id: q.id,
        type: 'QUESTION',
        question: q,
        text: q.text,
        tags: q.tags,
        claimsCount: 0,
        unresolvedCount: 1,
        weakCount: 0,
        missingCount: 1,
        childClaimIds: [],
        x: COL_QUESTION_X,
        y: qTopY,
        width: COL_QUESTION_W,
        height: HEIGHT_QUESTION,
      };

      const ghostNode: MapGhostNode = {
        id: ghostId,
        type: 'GHOST',
        ghostKind: 'no_claim',
        questionId: q.id,
        parentId: q.id,
        parentType: 'QUESTION',
        title: 'NO CLAIM',
        message: 'This question has not been answered.',
        linkStatus: 'missing',
        x: COL_CLAIM_X,
        y: ghostTopY,
        width: COL_CLAIM_W,
        height: HEIGHT_GHOST,
      };

      // Edge from Question to Ghost Claim
      const x1 = COL_QUESTION_X + COL_QUESTION_W;
      const y1 = qTopY + HEIGHT_QUESTION / 2;
      const x2 = COL_CLAIM_X;
      const y2 = ghostTopY + HEIGHT_GHOST / 2;
      const busX = Math.round((x1 + x2) / 2);

      edges.push({
        id: `edge-${q.id}-${ghostId}`,
        sourceId: q.id,
        targetId: ghostId,
        sourceType: 'QUESTION',
        targetType: 'GHOST',
        x1,
        y1,
        x2,
        y2,
        busX,
        status: 'missing',
        questionId: q.id,
      });

      nodes.push(qNode, ghostNode);
      questionNodes.push(qNode);
      ghostNodes.push(ghostNode);
      missingCount++;
      ghostCount++;

      currentY += Math.max(HEIGHT_QUESTION, HEIGHT_GHOST) + QUESTION_GAP;
      return;
    }

    // QUESTION WITH CLAIMS
    const claimLayoutItems: {
      claim: ClaimNode;
      claimY: number;
      evidenceIds: string[];
      evidenceSpan: { minY: number; maxY: number };
    }[] = [];

    let qSubtreeWeak = 0;
    let qSubtreeMissing = 0;
    let qSubtreeHolds = 0;

    q.claims.forEach((claim) => {
      totalClaimCount++;
      if (claim.linkStatus === 'holds') {
        holdsCount++;
        qSubtreeHolds++;
      } else if (claim.linkStatus === 'weak') {
        weakCount++;
        qSubtreeWeak++;
      } else if (claim.linkStatus === 'missing') {
        missingCount++;
        qSubtreeMissing++;
      }

      // Case A: Claim has no evidence -> Renders Ghost Evidence in Col 3
      if (!claim.evidence || claim.evidence.length === 0) {
        const itemY = currentY;
        const ghostId = `ghost-evidence-${claim.id}`;

        const ghostNode: MapGhostNode = {
          id: ghostId,
          type: 'GHOST',
          ghostKind: 'no_evidence',
          questionId: q.id,
          claimId: claim.id,
          parentId: claim.id,
          parentType: 'CLAIM',
          title: 'NO EVIDENCE',
          message: 'This claim has no supporting finding.',
          linkStatus: claim.linkStatus || 'missing',
          x: COL_EVIDENCE_X,
          y: itemY + (HEIGHT_CLAIM - HEIGHT_GHOST) / 2,
          width: COL_EVIDENCE_W,
          height: HEIGHT_GHOST,
        };

        const claimNode: MapClaimNode = {
          id: claim.id,
          type: 'CLAIM',
          claim,
          questionId: q.id,
          text: claim.text,
          linkStatus: claim.linkStatus,
          evidenceCount: 0,
          isRejected: claim.isRejected,
          childEvidenceIds: [],
          x: COL_CLAIM_X,
          y: itemY,
          width: COL_CLAIM_W,
          height: HEIGHT_CLAIM,
        };

        // Edge Claim -> Ghost Evidence
        const x1 = COL_CLAIM_X + COL_CLAIM_W;
        const y1 = itemY + HEIGHT_CLAIM / 2;
        const x2 = COL_EVIDENCE_X;
        const y2 = itemY + (HEIGHT_CLAIM - HEIGHT_GHOST) / 2 + HEIGHT_GHOST / 2;
        const busX = Math.round((x1 + x2) / 2);

        edges.push({
          id: `edge-${claim.id}-${ghostId}`,
          sourceId: claim.id,
          targetId: ghostId,
          sourceType: 'CLAIM',
          targetType: 'GHOST',
          x1,
          y1,
          x2,
          y2,
          busX,
          status: claim.linkStatus || 'missing',
          questionId: q.id,
          claimId: claim.id,
        });

        nodes.push(claimNode, ghostNode);
        claimNodes.push(claimNode);
        ghostNodes.push(ghostNode);
        ghostCount++;

        claimLayoutItems.push({
          claim,
          claimY: itemY,
          evidenceIds: [ghostId],
          evidenceSpan: { minY: itemY, maxY: itemY + HEIGHT_GHOST },
        });

        currentY += Math.max(HEIGHT_CLAIM, HEIGHT_GHOST) + SIBLING_GAP;
        return;
      }

      // Case B: Claim has 1 or more Evidence Findings
      const evYPositions: number[] = [];
      const evIds: string[] = [];

      claim.evidence.forEach((ev) => {
        totalEvidenceCount++;
        const evTopY = currentY;
        evYPositions.push(evTopY);
        evIds.push(ev.id);

        const isReasonMissing = !ev.userReason || ev.userReason.trim() === '';
        const findingTitle = ev.title || ev.placeholderText || 'Untitled finding';
        const sourceLabel = ev.citation || (ev.kind === 'paper' ? 'Paper source' : 'Experiment artifact');

        const evNode: MapEvidenceNode = {
          id: ev.id,
          type: 'EVIDENCE',
          evidence: ev,
          questionId: q.id,
          claimId: claim.id,
          kind: ev.kind,
          findingText: findingTitle,
          sourceTitle: sourceLabel,
          linkStatus: (ev as any).linkStatus || claim.linkStatus,
          isReasonMissing,
          x: COL_EVIDENCE_X,
          y: evTopY,
          width: COL_EVIDENCE_W,
          height: HEIGHT_EVIDENCE,
        };

        nodes.push(evNode);
        evidenceNodes.push(evNode);

        currentY += HEIGHT_EVIDENCE + SIBLING_GAP;
      });

      // Claim card vertical centering against its evidence children span
      const minEvY = Math.min(...evYPositions);
      const maxEvY = Math.max(...evYPositions);
      const totalEvHeight = (maxEvY + HEIGHT_EVIDENCE) - minEvY;
      const claimCenterY = minEvY + totalEvHeight / 2;
      const claimTopY = claimCenterY - HEIGHT_CLAIM / 2;

      const claimNode: MapClaimNode = {
        id: claim.id,
        type: 'CLAIM',
        claim,
        questionId: q.id,
        text: claim.text,
        linkStatus: claim.linkStatus,
        evidenceCount: claim.evidence.length,
        isRejected: claim.isRejected,
        childEvidenceIds: evIds,
        x: COL_CLAIM_X,
        y: claimTopY,
        width: COL_CLAIM_W,
        height: HEIGHT_CLAIM,
      };

      nodes.push(claimNode);
      claimNodes.push(claimNode);

      // Edges: Claim -> each Evidence Finding
      const cRightX = COL_CLAIM_X + COL_CLAIM_W;
      const cCenterY = claimTopY + HEIGHT_CLAIM / 2;
      const evLeftX = COL_EVIDENCE_X;
      const claimBusX = Math.round((cRightX + evLeftX) / 2);

      claim.evidence.forEach((ev, idx) => {
        const evCenterY = evYPositions[idx] + HEIGHT_EVIDENCE / 2;
        const edgeStatus = (ev as any).linkStatus || claim.linkStatus;

        edges.push({
          id: `edge-${claim.id}-${ev.id}`,
          sourceId: claim.id,
          targetId: ev.id,
          sourceType: 'CLAIM',
          targetType: 'EVIDENCE',
          x1: cRightX,
          y1: cCenterY,
          x2: evLeftX,
          y2: evCenterY,
          busX: claimBusX,
          status: edgeStatus,
          questionId: q.id,
          claimId: claim.id,
        });
      });

      claimLayoutItems.push({
        claim,
        claimY: claimTopY,
        evidenceIds: evIds,
        evidenceSpan: { minY: minEvY, maxY: maxEvY + HEIGHT_EVIDENCE },
      });
    });

    // Question card vertical centering against its claims span
    const minClaimCenterY = Math.min(...claimLayoutItems.map((item) => item.claimY + HEIGHT_CLAIM / 2));
    const maxClaimCenterY = Math.max(...claimLayoutItems.map((item) => item.claimY + HEIGHT_CLAIM / 2));
    const questionCenterY = (minClaimCenterY + maxClaimCenterY) / 2;
    const questionTopY = questionCenterY - HEIGHT_QUESTION / 2;

    const childClaimIds = q.claims.map((c) => c.id);

    const qNode: MapQuestionNode = {
      id: q.id,
      type: 'QUESTION',
      question: q,
      text: q.text,
      tags: q.tags,
      claimsCount: q.claims.length,
      unresolvedCount: qSubtreeWeak + qSubtreeMissing,
      weakCount: qSubtreeWeak,
      missingCount: qSubtreeMissing,
      childClaimIds,
      x: COL_QUESTION_X,
      y: questionTopY,
      width: COL_QUESTION_W,
      height: HEIGHT_QUESTION,
    };

    nodes.push(qNode);
    questionNodes.push(qNode);

    // Edges: Question -> each Claim
    const qRightX = COL_QUESTION_X + COL_QUESTION_W;
    const qCenterY = questionTopY + HEIGHT_QUESTION / 2;
    const claimLeftX = COL_CLAIM_X;
    const questionBusX = Math.round((qRightX + claimLeftX) / 2);

    q.claims.forEach((claim) => {
      const claimItem = claimLayoutItems.find((item) => item.claim.id === claim.id);
      const cCenterY = (claimItem?.claimY ?? questionTopY) + HEIGHT_CLAIM / 2;

      edges.push({
        id: `edge-${q.id}-${claim.id}`,
        sourceId: q.id,
        targetId: claim.id,
        sourceType: 'QUESTION',
        targetType: 'CLAIM',
        x1: qRightX,
        y1: qCenterY,
        x2: claimLeftX,
        y2: cCenterY,
        busX: questionBusX,
        status: claim.linkStatus,
        questionId: q.id,
        claimId: claim.id,
      });
    });

    currentY += QUESTION_GAP;
  });

  const totalHeight = Math.max(currentY + 60, 500);

  return {
    nodes,
    edges,
    questionNodes,
    claimNodes,
    evidenceNodes,
    ghostNodes,
    counts: {
      questions: questions.length,
      claims: totalClaimCount,
      evidence: totalEvidenceCount,
      ghosts: ghostCount,
      weak: weakCount,
      missing: missingCount,
      holds: holdsCount,
    },
    bounds: {
      width: TOTAL_CANVAS_MIN_WIDTH,
      height: totalHeight,
      minX: COL_QUESTION_X,
      maxX: COL_EVIDENCE_X + COL_EVIDENCE_W,
      minY: TOP_OFFSET,
      maxY: totalHeight,
    },
  };
}

/**
 * Builds clean 90-degree orthogonal elbow path with subtle 4px rounded corners.
 */
export function buildOrthogonalElbowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  busX: number,
  radius = 4
): string {
  if (Math.abs(y2 - y1) < 1.5) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  const r = Math.min(
    radius,
    Math.abs(busX - x1) / 2,
    Math.abs(x2 - busX) / 2,
    Math.abs(y2 - y1) / 2
  );

  if (y2 > y1) {
    // Parent higher than child: turn down at busX, then right to child
    return `M ${x1} ${y1} L ${busX - r} ${y1} Q ${busX} ${y1}, ${busX} ${y1 + r} L ${busX} ${y2 - r} Q ${busX} ${y2}, ${busX + r} ${y2} L ${x2} ${y2}`;
  } else {
    // Parent lower than child: turn up at busX, then right to child
    return `M ${x1} ${y1} L ${busX - r} ${y1} Q ${busX} ${y1}, ${busX} ${y1 - r} L ${busX} ${y2 + r} Q ${busX} ${y2}, ${busX + r} ${y2} L ${x2} ${y2}`;
  }
}
