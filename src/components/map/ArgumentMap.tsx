import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { QuestionNode, FilterStatus } from '../../types';
import { StandingSegment } from '../shell/StandingBar';
import {
  computeMapLayout,
  filterMapQuestions,
  MapNode,
  MapQuestionNode,
  MapClaimNode,
  MapEvidenceNode,
  MapGhostNode,
  COL_QUESTION_X,
  COL_QUESTION_W,
  COL_CLAIM_X,
  COL_CLAIM_W,
  COL_EVIDENCE_X,
  COL_EVIDENCE_W,
} from './mapLayout';
import { MapQuestionCard } from './MapQuestionCard';
import { MapClaimCard } from './MapClaimCard';
import { MapEvidenceCard } from './MapEvidenceCard';
import { MapGhostCard } from './MapGhostCard';
import { MapConnections } from './MapConnections';
import { MapHeader } from './MapHeader';
import { Button } from '../ui/instrument';

export interface ArgumentMapProps {
  questions: QuestionNode[];
  selectedNodeId?: string | null;
  onSelectNode: (node: {
    id: string;
    type: 'QUESTION' | 'CLAIM' | 'PAPER' | 'EXPERIMENT' | 'GHOST';
    questionId: string;
    claimId?: string;
    evidenceId?: string;
  }) => void;
  filter: FilterStatus;
  standingFilter?: StandingSegment;
  onFilterChange: (filter: FilterStatus) => void;
  onStandingFilterChange?: (segment: StandingSegment) => void;
  onNavigateToSurvey?: () => void;
  isLoading?: boolean;
}

export function ArgumentMap({
  questions,
  selectedNodeId,
  onSelectNode,
  filter,
  standingFilter = 'all',
  onFilterChange,
  onStandingFilterChange,
  onNavigateToSurvey,
  isLoading = false,
}: ArgumentMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // 1. Filter questions based on active filter state
  const filteredQuestions = useMemo(() => {
    return filterMapQuestions(questions, filter, standingFilter);
  }, [questions, filter, standingFilter]);

  // 2. Deterministic Layout Calculation
  const layout = useMemo(() => {
    return computeMapLayout(filteredQuestions);
  }, [filteredQuestions]);

  // Quick lookup map for nodes
  const nodeMap = useMemo(() => {
    const map = new Map<string, MapNode>();
    layout.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [layout.nodes]);

  // 3. Compute active path (Ancestors + Descendants) for hover or selection
  const activeComponentIds = useMemo(() => {
    const targetId = hoveredNodeId || selectedNodeId;
    if (!targetId) return null;

    const targetNode = nodeMap.get(targetId);
    if (!targetNode) return null;

    const set = new Set<string>();
    set.add(targetNode.id);

    // Add ancestors
    if (targetNode.type === 'EVIDENCE' || targetNode.type === 'GHOST') {
      if (targetNode.claimId) set.add(targetNode.claimId);
      if (targetNode.questionId) set.add(targetNode.questionId);
    } else if (targetNode.type === 'CLAIM') {
      if (targetNode.questionId) set.add(targetNode.questionId);
      // add direct children
      targetNode.childEvidenceIds.forEach((id) => set.add(id));
    } else if (targetNode.type === 'QUESTION') {
      targetNode.childClaimIds.forEach((claimId) => {
        set.add(claimId);
        const claim = nodeMap.get(claimId) as MapClaimNode | undefined;
        claim?.childEvidenceIds.forEach((evId) => set.add(evId));
      });
    }

    return set;
  }, [hoveredNodeId, selectedNodeId, nodeMap]);

  // Node Selection Handlers
  const handleSelectQuestion = useCallback(
    (q: MapQuestionNode) => {
      setFocusedNodeId(q.id);
      onSelectNode({
        id: q.id,
        type: 'QUESTION',
        questionId: q.id,
      });
    },
    [onSelectNode]
  );

  const handleSelectClaim = useCallback(
    (c: MapClaimNode) => {
      setFocusedNodeId(c.id);
      onSelectNode({
        id: c.id,
        type: 'CLAIM',
        questionId: c.questionId,
        claimId: c.id,
      });
    },
    [onSelectNode]
  );

  const handleSelectEvidence = useCallback(
    (ev: MapEvidenceNode) => {
      setFocusedNodeId(ev.id);
      onSelectNode({
        id: ev.id,
        type: ev.kind === 'paper' ? 'PAPER' : 'EXPERIMENT',
        questionId: ev.questionId,
        claimId: ev.claimId,
        evidenceId: ev.id,
      });
    },
    [onSelectNode]
  );

  const handleSelectGhostParent = useCallback(
    (g: MapGhostNode) => {
      setFocusedNodeId(g.parentId);
      if (g.parentType === 'QUESTION') {
        onSelectNode({
          id: g.questionId,
          type: 'QUESTION',
          questionId: g.questionId,
        });
      } else {
        onSelectNode({
          id: g.parentId,
          type: 'CLAIM',
          questionId: g.questionId,
          claimId: g.claimId,
        });
      }
    },
    [onSelectNode]
  );

  // Keyboard navigation across the 3 fixed columns
  const handleCardKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    const curr = nodeMap.get(currentId);
    if (!curr) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onSelectNode({
        id: '',
        type: 'QUESTION',
        questionId: '',
      });
      setFocusedNodeId(null);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (curr.type === 'QUESTION') handleSelectQuestion(curr as MapQuestionNode);
      else if (curr.type === 'CLAIM') handleSelectClaim(curr as MapClaimNode);
      else if (curr.type === 'EVIDENCE') handleSelectEvidence(curr as MapEvidenceNode);
      else if (curr.type === 'GHOST') handleSelectGhostParent(curr as MapGhostNode);
      return;
    }

    // Horizontal column navigation (Left = Parent, Right = Child)
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (curr.type === 'EVIDENCE' || (curr.type === 'GHOST' && curr.parentType === 'CLAIM')) {
        const parentClaim = nodeMap.get(curr.claimId || '');
        if (parentClaim) {
          setFocusedNodeId(parentClaim.id);
          const el = document.getElementById(`map-node-claim-${parentClaim.id}`);
          el?.focus();
        }
      } else if (curr.type === 'CLAIM' || (curr.type === 'GHOST' && curr.parentType === 'QUESTION')) {
        const parentQ = nodeMap.get(curr.questionId || '');
        if (parentQ) {
          setFocusedNodeId(parentQ.id);
          const el = document.getElementById(`map-node-question-${parentQ.id}`);
          el?.focus();
        }
      }
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (curr.type === 'QUESTION') {
        const qNode = curr as MapQuestionNode;
        const firstClaimId = qNode.childClaimIds[0] || `ghost-claim-${qNode.id}`;
        const firstClaim = nodeMap.get(firstClaimId);
        if (firstClaim) {
          setFocusedNodeId(firstClaim.id);
          const el = document.getElementById(`map-node-claim-${firstClaim.id}`) || document.getElementById(`map-node-ghost-${firstClaim.id}`);
          el?.focus();
        }
      } else if (curr.type === 'CLAIM') {
        const cNode = curr as MapClaimNode;
        const firstEvId = cNode.childEvidenceIds[0] || `ghost-evidence-${cNode.id}`;
        const firstEv = nodeMap.get(firstEvId);
        if (firstEv) {
          setFocusedNodeId(firstEv.id);
          const el = document.getElementById(`map-node-evidence-${firstEv.id}`) || document.getElementById(`map-node-ghost-${firstEv.id}`);
          el?.focus();
        }
      }
      return;
    }

    // Vertical navigation between siblings in the same column
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      let sameColNodes: MapNode[] = [];
      if (curr.type === 'QUESTION') sameColNodes = layout.questionNodes;
      else if (curr.type === 'CLAIM') sameColNodes = layout.claimNodes;
      else if (curr.type === 'EVIDENCE') sameColNodes = layout.evidenceNodes;

      const idx = sameColNodes.findIndex((n) => n.id === curr.id);
      if (idx !== -1) {
        const nextIdx = e.key === 'ArrowUp' ? Math.max(0, idx - 1) : Math.min(sameColNodes.length - 1, idx + 1);
        const nextNode = sameColNodes[nextIdx];
        if (nextNode) {
          setFocusedNodeId(nextNode.id);
          const prefix = nextNode.type === 'QUESTION' ? 'question' : nextNode.type === 'CLAIM' ? 'claim' : 'evidence';
          const el = document.getElementById(`map-node-${prefix}-${nextNode.id}`);
          el?.focus();
        }
      }
    }
  };

  const handleResetFilter = () => {
    onFilterChange('all');
    if (onStandingFilterChange) {
      onStandingFilterChange('all');
    }
  };

  // Synchronize filter changes with standing bar
  const handleFilterChangeWithSync = (newFilter: FilterStatus) => {
    onFilterChange(newFilter);
    if (onStandingFilterChange) {
      if (newFilter === 'all') onStandingFilterChange('all');
      else if (newFilter === 'weak') onStandingFilterChange('weak');
      else if (newFilter === 'missing') onStandingFilterChange('unsupported');
    }
  };

  // Scroll to selected node if selected outside
  useEffect(() => {
    if (selectedNodeId && containerRef.current) {
      const el =
        document.getElementById(`map-node-question-${selectedNodeId}`) ||
        document.getElementById(`map-node-claim-${selectedNodeId}`) ||
        document.getElementById(`map-node-evidence-${selectedNodeId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [selectedNodeId]);

  return (
    <div
      id="argument-map-container"
      className="relative flex flex-col h-full w-full bg-paper overflow-hidden select-none"
    >
      {/* Restrained Map Header with All | Weak only | Missing only */}
      <MapHeader
        filter={filter}
        standingFilter={standingFilter}
        onFilterChange={handleFilterChangeWithSync}
        onResetFilter={handleResetFilter}
        questionsCount={layout.counts.questions}
        claimsCount={layout.counts.claims}
        evidenceCount={layout.counts.evidence}
        weakCount={layout.counts.weak}
        missingCount={layout.counts.missing}
      />

      {/* Main Argument Map Scrollable Canvas Area (Structured Engineering Layout) */}
      <div
        ref={containerRef}
        id="argument-map-scroll-area"
        className="relative flex-1 w-full h-full overflow-auto bg-paper focus:outline-none"
        tabIndex={0}
      >
        {/* Sticky Column Headers */}
        <div
          id="map-column-sticky-headers"
          className="sticky top-0 z-20 w-full min-w-[1240px] px-8 py-2.5 bg-paper/95 backdrop-blur-xs border-b border-rule flex items-center select-none"
        >
          {/* Col 1: QUESTIONS */}
          <div
            style={{ width: `${COL_QUESTION_W}px`, marginLeft: `${COL_QUESTION_X}px` }}
            className="flex items-center justify-between pr-4"
          >
            <span className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-ink-muted">
              QUESTIONS
            </span>
            <span className="text-[11px] font-mono text-ink-muted/80">
              · {layout.counts.questions}
            </span>
          </div>

          {/* Col 2: CLAIMS */}
          <div
            style={{ width: `${COL_CLAIM_W}px`, marginLeft: `80px` }}
            className="flex items-center justify-between pr-4"
          >
            <span className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-ink-muted">
              CLAIMS
            </span>
            <span className="text-[11px] font-mono text-ink-muted/80">
              · {layout.counts.claims}
            </span>
          </div>

          {/* Col 3: EVIDENCE */}
          <div
            style={{ width: `${COL_EVIDENCE_W}px`, marginLeft: `80px` }}
            className="flex items-center justify-between pr-4"
          >
            <span className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-ink-muted">
              EVIDENCE
            </span>
            <span className="text-[11px] font-mono text-ink-muted/80">
              · {layout.counts.evidence}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 w-[1240px] flex flex-col gap-8 animate-pulse">
            <div className="flex items-center gap-12">
              <div className="w-[300px] h-[96px] bg-surface border border-rule rounded-[2px]" />
              <div className="w-[340px] h-[84px] bg-surface border border-rule rounded-[2px]" />
              <div className="w-[360px] h-[92px] bg-surface border border-rule rounded-[2px]" />
            </div>
            <div className="flex items-center gap-12">
              <div className="w-[300px] h-[96px] bg-surface border border-rule rounded-[2px]" />
              <div className="w-[340px] h-[84px] bg-surface border border-rule rounded-[2px]" />
              <div className="w-[360px] h-[92px] bg-surface border border-rule rounded-[2px]" />
            </div>
          </div>
        )}

        {/* Empty State: No Questions in Workspace */}
        {!isLoading && questions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 max-w-md mx-auto">
            <div className="w-8 h-[2px] bg-rule mb-4" />
            <h2 className="text-[12px] font-mono font-semibold uppercase tracking-[0.08em] text-ink mb-2">
              NO QUESTIONS
            </h2>
            <p className="font-serif text-[15px] leading-relaxed text-ink-muted mb-6">
              Begin in Survey. A question can only be promoted after you have
              written a claim that answers it and confirmed that the claim could
              be false and could be settled within a year.
            </p>
            {onNavigateToSurvey && (
              <Button
                variant="primary"
                onClick={onNavigateToSurvey}
                className="font-mono text-[12px]"
              >
                Go to Survey
              </Button>
            )}
          </div>
        )}

        {/* Empty State: Filter Returned No Results */}
        {!isLoading && questions.length > 0 && filteredQuestions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[340px] text-center p-8 max-w-md mx-auto">
            <h2 className="text-[12px] font-mono font-semibold uppercase tracking-[0.08em] text-ink mb-1.5">
              {filter === 'weak'
                ? 'NO WEAK LINKS IN THIS VIEW'
                : filter === 'missing'
                  ? 'NO MISSING LINKS IN THIS VIEW'
                  : 'NO MATCHING BRANCHES'}
            </h2>
            <p className="text-[13px] font-sans text-ink-muted mb-5">
              The filter is still active. No broken reasoning matches the current
              criteria.
            </p>
            <Button
              variant="secondary"
              onClick={handleResetFilter}
              className="text-[12px]"
            >
              Show all
            </Button>
          </div>
        )}

        {/* The Argument Map Layout Canvas */}
        {!isLoading && filteredQuestions.length > 0 && (
          <div
            id="map-canvas-plane"
            className="relative"
            style={{
              minWidth: `${layout.bounds.width}px`,
              height: `${layout.bounds.height}px`,
            }}
          >
            {/* SVG Fault Line Connections */}
            <MapConnections
              edges={layout.edges}
              activeComponentIds={activeComponentIds}
              width={layout.bounds.width}
              height={layout.bounds.height}
            />

            {/* Questions Column */}
            {layout.questionNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isActivePath = !!activeComponentIds?.has(node.id);
              const isDimmed = !!activeComponentIds && !isActivePath;

              return (
                <MapQuestionCard
                  key={node.id}
                  node={node}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isDimmed={isDimmed}
                  isActivePath={isActivePath}
                  onSelect={handleSelectQuestion}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onKeyDown={(e) => handleCardKeyDown(e, node.id)}
                />
              );
            })}

            {/* Claims Column */}
            {layout.claimNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isActivePath = !!activeComponentIds?.has(node.id);
              const isDimmed = !!activeComponentIds && !isActivePath;

              return (
                <MapClaimCard
                  key={node.id}
                  node={node}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isDimmed={isDimmed}
                  isActivePath={isActivePath}
                  onSelect={handleSelectClaim}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onKeyDown={(e) => handleCardKeyDown(e, node.id)}
                />
              );
            })}

            {/* Evidence Findings Column */}
            {layout.evidenceNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isActivePath = !!activeComponentIds?.has(node.id);
              const isDimmed = !!activeComponentIds && !isActivePath;

              return (
                <MapEvidenceCard
                  key={node.id}
                  node={node}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  isDimmed={isDimmed}
                  isActivePath={isActivePath}
                  onSelect={handleSelectEvidence}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onKeyDown={(e) => handleCardKeyDown(e, node.id)}
                />
              );
            })}

            {/* Ghost Structural Absence Nodes */}
            {layout.ghostNodes.map((node) => {
              const isHovered = hoveredNodeId === node.id;
              const isActivePath = !!activeComponentIds?.has(node.parentId);
              const isDimmed = !!activeComponentIds && !isActivePath;

              return (
                <MapGhostCard
                  key={node.id}
                  node={node}
                  isHovered={isHovered}
                  isDimmed={isDimmed}
                  isActivePath={isActivePath}
                  onSelectParent={handleSelectGhostParent}
                  onMouseEnter={() => setHoveredNodeId(node.parentId)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onKeyDown={(e) => handleCardKeyDown(e, node.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
