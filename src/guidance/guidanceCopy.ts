/**
 * Centralized guidance copy module for Instrument.
 * Every guidance string (hover tips, explainers, surface notes, domain terms,
 * computed values, disabled reasons) is declared here with unique identifiers.
 *
 * Rules:
 * - Sentence case.
 * - No terminal period on fragments; full stops on full sentences.
 * - Plain verbs, second person, present tense.
 * - State rule, then reason, when both fit in two lines.
 * - Never scold, never apologise, never call deliberate constraints limitations.
 * - Never use the words tooltip, hint, or help.
 */

export const GUIDANCE_COPY = {
  // ==========================================
  // 1. SURFACE NOTES (Mechanism 3 - One line per surface, dismissible)
  // ==========================================
  surface_notes: {
    map: 'Where is the argument broken?',
    readiness: 'What can be concluded right now?',
    survey: 'What is still open, and which questions are worth asking?',
    papers: 'Which findings does this reading produce?',
    experiments: 'Did the test measure the claim?',
    draft: 'Does the writing match what the graph supports?',
  },

  // ==========================================
  // 2. EXPLAINER POPOVERS (Mechanism 2 - Explicit ? affordance, 2-5 lines)
  // ==========================================
  explainers: {
    standing_bar: {
      title: 'The Standing Bar',
      body: 'Tracks the health of the whole tree at a glance. Counts reflect link verification status (holds, weak, missing), unwritten user reasons, and open questions without claims. Clicking any segment filters the view.',
    },
    survey_hard_stop: {
      title: 'The Fifteen-Note Stop',
      body: 'Capped at fifteen loose notes when fewer than three candidate questions exist. This intentional friction forces clustering open problems into structured questions before gathering more.',
    },
    survey_gate: {
      title: 'The Survey Gate',
      body: 'The survey collects open problems before questions exist. The 15-note cap enforces clustering loose notes into candidate questions before gathering more.',
    },
    promotion_test: {
      title: 'The Promotion Test',
      body: 'A candidate question becomes a real question only after you write a claim answering it, confirm that the claim could be false, and confirm it could be settled within a year.',
    },
    promotion_falsification_test: {
      title: 'Falsification & Promotion',
      body: 'To promote a candidate to a real question, you must supply an answering claim, define what empirical evidence would prove it false, and verify it can be settled within a year.',
    },
    verification_table: {
      title: 'Type, Scope, and Target Verification',
      body: 'The Examiner evaluates three independent axes: Type (causal vs correlational), Scope (narrow setting vs broad claim), and Target (measurement proxy vs true claim). All three must pass for a link to hold.',
    },
    readiness_tiers: {
      title: 'Readiness Tiers',
      body: 'Computed from the weakest link in a claim subtree. Ready means all supporting findings pass Type, Scope, and Target. Tentative has support but unresolved checks. Rejected preserves untenable claims as history.',
    },
    draft_support_ledger: {
      title: 'Draft Support Ledger & Drift',
      body: 'Every manuscript section is matched against the argument graph. Drift occurs when a claim is modified after placement in the draft, or when prose asserts findings the graph does not support.',
    },
    draft_drift: {
      title: 'Draft Drift Detection',
      body: 'Tracks divergence between manuscript prose and the underlying argument graph. Warns when claims are modified after placement or unsupported findings are referenced.',
    },
    draft_not_export: {
      title: 'Draft As Argument Assembly',
      body: 'The draft surface is where the argument is assembled into prose without hiding unresolved gaps, unplaced contradictions, or weak links.',
    },
    examiner_operations: {
      title: 'Permitted Operations',
      body: 'The Examiner only runs explicit, structured operations you trigger. It checks reasoning you committed first and proposes graph edits, but never writes user reasons or alters data directly.',
    },
    only_mine: {
      title: 'Only Mine View',
      body: 'Hides all model-produced check results, examiner findings, and clustering proposals. Reveals only what you asserted and wrote yourself.',
    },
    map_overview: {
      title: 'The Argument Map',
      body: 'Three strict levels: Question, Claim, and Evidence finding. Orthogonal elbow connections reveal where your reasoning is unsupported or broken. There is no dragging and no force-directed layout.',
    },
    finding_not_paper: {
      title: 'Findings vs. Papers',
      body: 'A paper is not evidence; a finding is. One paper produces multiple findings, and some may cut against the claim. Linking findings individually prevents collapsing distinct results.',
    },
    reason_required: {
      title: 'User Reason Requirement',
      body: 'Every link requires a committed user reason before it can be checked. The Examiner evaluates whether the child supports the parent under your reasoning, never inventing reasons for you.',
    },
    experiment_grouped_by_claim: {
      title: 'Experiments Grouped by Claim',
      body: 'Artifacts (plots, tables, notes) are grouped under the claim each experiment tests, keeping outputs one click away from the hypothesis they were designed to examine.',
    },
    reading_session_purpose: {
      title: 'Reading Session Purpose',
      body: 'The reader is designed to produce findings for the argument graph. Highlights remain local to the document, but findings join the graph under your reasoning.',
    },
  },

  // ==========================================
  // 3. DISABLED CONTROL PRECONDITIONS (Mechanism 1)
  // ==========================================
  disabled: {
    check_link:
      'Write your reason on this link first. The check only means something because you committed the reason.',
    survey_add_note:
      'Fifteen loose notes with fewer than three candidates. Cluster some notes before adding more.',
    promote_candidate:
      'Write a claim that answers this, and confirm both tests.',
    save_observation:
      'Record what this showed before saving.',
    create_finding:
      'A finding needs your reason before it can join the graph.',
    check_all_links:
      'All findings lack user reasons. Write reasons on links before checking.',
    cluster_notes:
      'At least two open problem notes needed to propose clusters.',
    explain_verdict:
      'No check verdict exists for this link yet.',
  },

  // ==========================================
  // 4. DOMAIN TERMS (Definition tips on first occurrence per surface)
  // ==========================================
  terms: {
    finding:
      'A specific result from a paper. The paper itself is not evidence; one paper yields several findings, and some may cut against the claim.',
    ghost:
      'Rendered where a claim has no evidence or a question has no claims. Nothing is stored.',
    type:
      'Whether the claim is causal but the evidence is only correlational.',
    scope:
      'Whether the evidence holds in a narrower setting than the claim.',
    target:
      'Whether the experiment measures something other than the claim.',
    holds:
      'All three axes (Type, Scope, Target) passed for this link.',
    weak:
      'At least one axis returned a partial match or unverified condition.',
    missing:
      'No user reason, missing evidence, or a direct mismatch on an axis.',
    tentative:
      'Tentative: has support, but one check returned a scope mismatch.',
    ready:
      'Ready: all supporting findings hold with passing Type, Scope, and Target checks.',
    rejected:
      'Rejected: preserved in history as an untenable claim.',
    candidate_question:
      'A grouping of open problems. Not yet a question.',
    standing_note:
      'Your synthesis for this question. Kept, never overwritten.',
    stale_reference:
      'The claim changed after you placed it in the draft.',
  },

  // ==========================================
  // 5. COMPUTED VALUES (Mechanism 1)
  // ==========================================
  computed: {
    standing_holds: 'Holds: count of verified links where Type, Scope, and Target all passed.',
    standing_weak: 'Weak: count of links with partial or unresolved check axes.',
    standing_unsupported: 'Unsupported: count of claims with missing evidence findings.',
    standing_unwritten: 'Reasons unwritten: count of links missing your committed reasoning.',
    standing_open: 'Open questions: count of questions with no answering claims.',
    readiness_tier: 'Tentative: has support, but one check returned a scope mismatch.',
    defect_missing_reason: 'Write why this supports the parent to clear this defect.',
    defect_missing_evidence: 'Link an empirical or experimental finding to clear this defect.',
    draft_gap_unsupported: 'Link supporting evidence in the graph to resolve this gap.',
    session_findings: 'Number of findings extracted and linked during this active reading session.',
  },

  // ==========================================
  // 6. ICON-ONLY CONTROLS AND ACTIONS
  // ==========================================
  actions: {
    theme_light: 'Switch to light mode',
    theme_dark: 'Switch to dark mode',
    toggle_dock: 'Toggle Examiner dock (⌘J)',
    close: 'Close',
    close_finding_slip: 'Close finding slip',
    close_overlay: 'Close overlay',
    close_modal: 'Close modal',
    edit_reason: 'Edit reason in place',
    edit_note: 'Edit note',
    delete_note: 'Delete note',
    drag_reorder: 'Drag to reorder or cluster',
    restore_surface_note: 'Restore surface guidance note',
    search_claims: 'Search claims in argument',
    back_to_map: 'Back to argument map',
    view_in_context: 'View passage in reader context',
  },

  // ==========================================
  // 7. MODEL ATTRIBUTION AND PREVIEWS
  // ==========================================
  model: {
    attribution: 'Produced by cx/gpt-5.6-sol. Hidden when Only mine is on.',
    preview_not_wired: 'Sample output. No model was called and nothing was changed.',
    edit_undone: 'This edit was undone. The line is kept as history.',
  },
} as const;

export type GuidanceKey =
  | { type: 'surface'; id: keyof typeof GUIDANCE_COPY.surface_notes }
  | { type: 'explainer'; id: keyof typeof GUIDANCE_COPY.explainers }
  | { type: 'disabled'; id: keyof typeof GUIDANCE_COPY.disabled }
  | { type: 'term'; id: keyof typeof GUIDANCE_COPY.terms }
  | { type: 'computed'; id: keyof typeof GUIDANCE_COPY.computed }
  | { type: 'action'; id: keyof typeof GUIDANCE_COPY.actions }
  | { type: 'model'; id: keyof typeof GUIDANCE_COPY.model };
