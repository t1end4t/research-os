import React from 'react';
import { QuestionNode, FilterStatus } from '../types';
import { StandingSegment } from './shell/StandingBar';
import { ArgumentMap } from './map/ArgumentMap';

export interface GraphCanvasProps {
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

export function GraphCanvas(props: GraphCanvasProps) {
  return <ArgumentMap {...props} />;
}
