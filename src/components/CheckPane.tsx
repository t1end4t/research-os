import { ClaimNode, EvidenceKind, QuestionNode } from '../types';
import { ShieldAlert, ShieldCheck, CornerDownRight, Plus, X, RotateCcw, ArrowRight } from 'lucide-react';

interface CheckPaneProps {
  claim: ClaimNode | undefined;
  selectedQuestion?: QuestionNode | undefined;
  onRejectClaim: (claimId: string) => void;
  onEditClaim: (claimId: string, evidenceKind?: EvidenceKind) => void;
  onReset: () => void;
}

export function CheckPane({
  claim,
  selectedQuestion,
  onRejectClaim,
  onEditClaim,
  onReset,
}: CheckPaneProps) {
  const openClaimEditor = (fieldId: string, evidenceKind?: EvidenceKind) => {
    onEditClaim(claim?.id || '', evidenceKind);
    window.requestAnimationFrame(() => document.getElementById(fieldId)?.focus());
  };

  if (!claim) {
    if (selectedQuestion) {
      return (
        <div
          id="check-pane-empty-question"
          className="h-full overflow-y-auto p-6 md:p-8 bg-[#f9f9f9] dark:bg-[#181818]"
        >
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-sm space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                No claims yet
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Use the edit icon on the question card to add one.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div id="check-pane-empty" className="h-full flex items-center justify-center p-8 text-stone-400 dark:text-stone-600 text-sm font-mono">
        Select a claim on the left to inspect checks
      </div>
    );
  }

  const { check } = claim;

  const getTagBadgeStyle = (tagColor: string) => {
    switch (tagColor) {
      case 'emerald':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-500/20';
      case 'red':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 ring-1 ring-rose-500/20';
      case 'amber':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 ring-1 ring-amber-500/20';
      default:
        return 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700';
    }
  };

  const getCheckStatusBadge = (status: string) => {
    switch (status) {
      case 'aligned':
        return <span className="text-[11px] font-mono font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">Pass</span>;
      case 'partial':
        return <span className="text-[11px] font-mono font-medium text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">Partial</span>;
      case 'mismatch':
        return <span className="text-[11px] font-mono font-medium text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">Mismatch</span>;
      case 'missing':
        return <span className="text-[11px] font-mono font-medium text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">Missing</span>;
      default:
        return <span className="text-[11px] font-mono font-medium text-stone-600 dark:text-stone-400 bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded">Unchecked</span>;
    }
  };

  return (
    <div id="check-pane" className="h-full overflow-y-auto p-6 md:p-8 bg-[#f9f9f9] dark:bg-[#181818]">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header: claim -> evidence */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1 text-[#2C5EA8] dark:text-[#7DB4F8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2C5EA8] dark:bg-[#7DB4F8]" />
              claim
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
            <span className="flex items-center gap-1 text-[#2A6E77] dark:text-[#6CD0DE]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2A6E77] dark:bg-[#6CD0DE]" />
              evidence
            </span>
          </div>
          <button
            onClick={onReset}
            title="Reset to original state"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>reset</span>
          </button>
        </div>

        {/* Read-only field labelled "YOUR REASON" */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            YOUR REASON
          </label>
          <div
            id="your-reason-field"
            className="w-full rounded-lg border border-stone-200 dark:border-[#2a2a2a] bg-stone-50/70 dark:bg-[#1e1e1e] p-3.5 text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed font-sans select-text cursor-default"
          >
            {check.reasonText}
          </div>
        </div>

        {/* Main Check Card with Result */}
        <div className="rounded-xl border border-stone-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] p-5 shadow-2xs space-y-4">
          {/* Check Result Tag */}
          <div className="flex items-center gap-2">
            <span
              id="check-result-tag"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wide uppercase border ${getTagBadgeStyle(
                check.tagColor
              )}`}
            >
              {check.tagColor === 'emerald' ? (
                <ShieldCheck className="w-3.5 h-3.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5" />
              )}
              {check.tag}
            </span>
          </div>

          {/* 2-3 sentences explanation */}
          <p
            id="check-explanation-text"
            className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal"
          >
            {check.explanation}
          </p>

          {/* Three action buttons: "Weaken claim", "Add experiment", "Reject" */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              id="btn-weaken-claim"
              onClick={() => openClaimEditor('manual-node-text')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-stone-100 dark:bg-[#252525] hover:bg-stone-200 dark:hover:bg-[#303030] text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-[#333333] transition-colors active:scale-98 cursor-pointer"
            >
              <CornerDownRight className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
              Weaken claim
            </button>

            <button
              id="btn-add-experiment"
              onClick={() => openClaimEditor('manual-evidence-kind', 'experiment')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-100 text-white dark:text-stone-900 shadow-xs transition-colors active:scale-98 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add experiment
            </button>

            <button
              id="btn-reject-claim"
              onClick={() => onRejectClaim(claim.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors active:scale-98 cursor-pointer ${
                claim.isRejected
                  ? 'bg-rose-50 dark:bg-[#351515] text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-white dark:bg-[#222222] hover:bg-rose-50 dark:hover:bg-[#301c1c] text-stone-600 dark:text-stone-300 hover:text-rose-700 dark:hover:text-rose-300 border-stone-200 dark:border-[#333333] hover:border-rose-200 dark:hover:border-rose-800'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              {claim.isRejected ? 'Un-reject' : 'Reject'}
            </button>
          </div>
        </div>

        {/* Small grey box listing three checks: Type, Scope, Target — one line each */}
        <div
          id="three-checks-summary-box"
          className="rounded-lg border border-stone-200/90 dark:border-[#2a2a2a] bg-stone-100/80 dark:bg-[#202020] p-3.5 space-y-2.5"
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold mb-1">
            Verification criteria
          </div>

          {check.checks.map((chk) => (
            <div
              key={chk.label}
              className="flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-mono font-semibold text-stone-700 dark:text-stone-300 w-12 shrink-0">
                  {chk.label}
                </span>
                <span className="text-stone-600 dark:text-stone-400 truncate">{chk.detail}</span>
              </div>
              <div className="shrink-0">{getCheckStatusBadge(chk.status)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
