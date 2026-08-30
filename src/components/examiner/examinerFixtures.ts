import { ExaminerVerdictData, ExaminerConfirmationData, ExaminerContextData } from './types';

/**
 * Produces structured 3-axis link check verdict based on context.
 * Marked as `preview · not wired` to be honest about current client-side state.
 */
export function generateLinkCheckVerdict(
  context: ExaminerContextData
): ExaminerVerdictData {
  const isC1 = context.claimId === 'c1' || context.id === 'c1' || context.label.includes('Sparse coding');
  const isC2 = context.claimId === 'c2' || context.id === 'c2';
  const isC3 = context.claimId === 'c3' || context.id === 'c3';
  const isExp = context.kind === 'experiment' || context.kind === 'artifact';

  if (isExp) {
    return {
      overallStatus: 'weak',
      modelId: 'cx/gpt-5.6-sol',
      isPrewiredPreview: true,
      axes: [
        {
          label: 'Type',
          verdict: 'pass',
          detail: 'intervention targets receptive field distribution directly',
        },
        {
          label: 'Scope',
          verdict: 'partial',
          detail: 'synthetic natural image statistics; not biological in vivo',
        },
        {
          label: 'Target',
          verdict: 'mismatch',
          detail: 'measures orientation tuning bandwidth, but claim asserts total overlap',
        },
      ],
      finding:
        'Measurement assesses orientation bandwidth rather than receptive field overlap across cell populations.',
      actions: ['weaken_claim', 'add_experiment', 'dismiss'],
      claimId: context.claimId,
      evidenceId: context.evidenceId,
    };
  }

  if (isC2) {
    return {
      overallStatus: 'missing',
      modelId: 'cx/gpt-5.6-sol',
      isPrewiredPreview: true,
      axes: [
        {
          label: 'Type',
          verdict: 'mismatch',
          detail: 'claim asserts causal interference, evidence is purely correlational',
        },
        {
          label: 'Scope',
          verdict: 'partial',
          detail: 'receptive field properties tested only in static linear regime',
        },
        {
          label: 'Target',
          verdict: 'mismatch',
          detail: 'no experimental ablation of overlap to verify causal direction',
        },
      ],
      finding:
        'Claim asserts a causal mechanism between overlap and interference, but evidence shows only co-occurrence.',
      actions: ['weaken_claim', 'add_experiment', 'dismiss'],
      claimId: context.claimId,
      evidenceId: context.evidenceId,
    };
  }

  if (isC3) {
    return {
      overallStatus: 'holds',
      modelId: 'cx/gpt-5.6-sol',
      isPrewiredPreview: true,
      axes: [
        {
          label: 'Type',
          verdict: 'pass',
          detail: 'both address spatial frequency encoding bounds',
        },
        {
          label: 'Scope',
          verdict: 'pass',
          detail: 'valid within primary visual cortex mammal models',
        },
        {
          label: 'Target',
          verdict: 'pass',
          detail: 'gabor filter bank geometry matches biological tuning curves',
        },
      ],
      finding:
        'Finding directly supports spatial frequency constraints on 2D Gabor wavelet bases.',
      actions: ['dismiss'],
      claimId: context.claimId,
      evidenceId: context.evidenceId,
    };
  }

  // Default C1 / general link check
  return {
    overallStatus: 'weak',
    modelId: 'cx/gpt-5.6-sol',
    isPrewiredPreview: true,
    axes: [
      {
        label: 'Type',
        verdict: 'pass',
        detail: 'both address encoding mechanism from natural scene statistics',
      },
      {
        label: 'Scope',
        verdict: 'mismatch',
        detail: 'evidence is anesthetised cat V1; the claim says "cortex"',
      },
      {
        label: 'Target',
        verdict: 'pass',
        detail: 'measures receptive field geometry directly',
      },
    ],
    finding:
      'Evidence is anesthetised cat V1; the claim says "cortex".',
    actions: ['weaken_claim', 'add_experiment', 'dismiss'],
    claimId: context.claimId,
    evidenceId: context.evidenceId,
  };
}

/**
 * Produces structured explanation for existing verdict
 */
export function generateVerdictExplanation(
  context: ExaminerContextData
): string {
  if (context.existingVerdict) {
    const v = context.existingVerdict;
    return `Analysis of ${context.subjectType} link: Status is ${v.overallStatus.toUpperCase()}.
• Type: ${v.axes.find((a) => a.label === 'Type')?.verdict.toUpperCase() || 'PASS'}
• Scope: ${v.axes.find((a) => a.label === 'Scope')?.verdict.toUpperCase() || 'MISMATCH'}
• Target: ${v.axes.find((a) => a.label === 'Target')?.verdict.toUpperCase() || 'PASS'}

Summary finding: ${v.finding}`;
  }

  return `Analysis of ${context.subjectType} link:
• Type (pass): Causal direction matches the mechanistic claim.
• Scope (mismatch): The empirical data was collected in anesthetised cat V1, while the claim generalizes to primate and mammal cortex broadly.
• Target (pass): Quantitative orientation tuning matches simple-cell profiles.`;
}

/**
 * Produces structured graph edit confirmation
 */
export function generateGraphEditConfirmation(
  actionType: 'rename' | 'move' | 'split' | 'delete' | 'add',
  context: ExaminerContextData,
  details?: string
): ExaminerConfirmationData {
  let actionDescription = '';
  switch (actionType) {
    case 'rename':
      actionDescription = `Renamed ${context.subjectType.toLowerCase()} → "${details || context.subjectName}"`;
      break;
    case 'split':
      actionDescription = `Split ${context.subjectType.toLowerCase()} into two distinct sub-assertions`;
      break;
    case 'move':
      actionDescription = `Moved ${context.subjectType.toLowerCase()} to new parent in graph`;
      break;
    case 'delete':
      actionDescription = `Removed ${context.subjectType.toLowerCase()} from tree`;
      break;
    case 'add':
      actionDescription = `Added new node under ${context.subjectName}`;
      break;
  }

  return {
    modelId: 'cx/gpt-5.6-sol',
    actionDescription,
    isPrewiredPreview: true,
    undoPayload: {
      type: actionType,
      nodeId: context.id,
      claimId: context.claimId,
      evidenceId: context.evidenceId,
      previousValue: context.subjectName,
    },
  };
}
