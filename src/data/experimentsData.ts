import { ExperimentGroup } from '../types';

export const INITIAL_EXPERIMENTS_DATA: ExperimentGroup[] = [
  {
    id: 'exp-1',
    name: 'Train an overcomplete sparse coder on natural image patches',
    questionId: 'q1',
    questionText: 'How does V1 encode natural scenes?',
    claimId: 'c1',
    claimText: 'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
    claimStatus: 'weak',
    status: 'done',
    targetStatement:
      'Whether learned basis functions reproduce the orientation and spatial-frequency distribution observed in V1 simple cells.',
    date: 'Oct 14, 2024',
    checkResult: {
      modelId: 'cx/gpt-5.6-sol',
      timestamp: 'checked 2 days ago',
      finding:
        'Target aligned: generative basis functions directly compare against physiological simple-cell RF tuning properties.',
      axes: [
        {
          label: 'TYPE',
          verdict: 'pass',
          detail: 'Mechanistic generative model fits direct spatial receptive field basis.',
        },
        {
          label: 'SCOPE',
          verdict: 'pass',
          detail: 'Natural image patches derived from standard whitened scene statistics.',
        },
        {
          label: 'TARGET',
          verdict: 'pass',
          detail:
            'Directly compares spatial frequency, orientation bandwidth, and aspect ratio.',
        },
      ],
    },
    artifacts: [
      {
        id: 'art-plot-1',
        type: 'PLOT',
        title: 'Learned Basis Functions vs V1 Tuning Distribution',
        filename: 'learned_basis_functions.png',
        caption:
          '2D spatial profiles and orientation tuning curves of 256 learned basis filters.',
        date: 'Oct 14, 2024',
        claimId: 'c1',
        claimText:
          'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
        experimentId: 'exp-1',
        findingSummary:
          'The learned basis functions became oriented, but their spatial-frequency distribution was narrower than the V1 comparison set.',
        findingAuthor: 'user',
        plotLabels: {
          x: 'Spatial Frequency (cyc/deg)',
          y: 'Orientation Selectivity (deg)',
        },
        plotPoints: [
          { x: 0.5, y: 12.0, y2: 14.5, label: '0.5 cpd' },
          { x: 1.0, y: 32.5, y2: 38.0, label: '1.0 cpd' },
          { x: 2.0, y: 48.0, y2: 52.0, label: '2.0 cpd' },
          { x: 4.0, y: 28.0, y2: 44.0, label: '4.0 cpd' },
          { x: 8.0, y: 8.5, y2: 24.0, label: '8.0 cpd' },
        ],
      },
      {
        id: 'art-table-1',
        type: 'TABLE',
        title: 'Orientation & Frequency Distribution Comparison',
        filename: 'orientation_distribution.csv',
        caption:
          'Comparison table between model basis filters and physiological single-unit recordings in macaque V1.',
        date: 'Oct 16, 2024',
        claimId: 'c1',
        claimText:
          'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
        experimentId: 'exp-1',
        findingSummary:
          'Aspect ratio and orientation bandwidth match macaque simple cells within 8% margin; high-frequency cutoff falls short.',
        findingAuthor: 'user',
        tableHeaders: ['Property', 'Model Basis', 'V1 Physiology', 'Verdict'],
        tableRows: [
          ['Aspect Ratio', '1.82 ± 0.31', '1.95 ± 0.44', 'Pass'],
          ['Orient. Bandwidth', '38.4°', '41.2°', 'Pass'],
          ['Spatial Freq. Peak', '1.85 cpd', '2.10 cpd', 'Partial'],
          ['High-Freq Cutoff', '3.40 cpd', '5.80 cpd', 'Mismatch'],
        ],
        totalRows: 12,
      },
      {
        id: 'art-note-1',
        type: 'NOTE',
        title: 'Training Notes and Parameter Sensitivity',
        filename: 'training_notes.md',
        caption:
          'Empirical convergence notes across varying Cauchy and L1 sparsity penalty hyperparameters.',
        date: 'Oct 18, 2024',
        claimId: 'c1',
        claimText:
          'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
        experimentId: 'exp-1',
        findingSummary: '', // Intentionally unwritten for testing "Needs result" filter & required check
        noteContent:
          'Trained using conjugate gradient descent over 100,000 16x16 natural image patches drawn from the Olshausen natural scenes dataset. Sparsity penalty lambda was swept from 0.05 to 0.40. Convergence stabilized at step 62,000 without basis dead-units. Need to document formal conclusion regarding whether high-frequency under-representation is an artifact of patch boundary windowing.',
      },
    ],
  },
  {
    id: 'exp-2',
    name: 'Dictionary size sweep on natural image patches',
    questionId: 'q1',
    questionText: 'How does V1 encode natural scenes?',
    claimId: 'c1',
    claimText: 'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
    claimStatus: 'weak',
    status: 'running',
    targetStatement:
      'Whether larger dictionary expansion ratios directly improve receptive-field tuning geometry fit.',
    date: 'Running · 2 artifacts',
    targetMismatchNote:
      'Target mismatch — the sweep measures reconstruction error, not receptive-field shape.',
    checkResult: {
      modelId: 'cx/gpt-5.6-sol',
      timestamp: 'checked 6 hours ago',
      finding:
        'Target mismatch: reconstruction loss does not measure receptive-field tuning geometry.',
      axes: [
        {
          label: 'TYPE',
          verdict: 'pass',
          detail: 'both are causal interventions',
        },
        {
          label: 'SCOPE',
          verdict: 'partial',
          detail: 'the sweep uses grayscale patches only',
        },
        {
          label: 'TARGET',
          verdict: 'mismatch',
          detail:
            'the sweep measures reconstruction error, not receptive-field shape',
        },
      ],
    },
    artifacts: [
      {
        id: 'art-plot-sweep',
        type: 'PLOT',
        title: 'Reconstruction MSE vs Dictionary Expansion',
        filename: 'reconstruction_vs_expansion.png',
        caption:
          'Reconstruction MSE loss plotted against dictionary overcompleteness factor (1x to 16x).',
        date: 'Yesterday',
        claimId: 'c1',
        claimText:
          'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
        experimentId: 'exp-2',
        findingSummary:
          'Reconstruction loss plateaus past 4x expansion, but tuning curves remain uncomputed.',
        findingAuthor: 'user',
        plotLabels: {
          x: 'Expansion Factor (x)',
          y: 'Reconstruction Loss (MSE)',
        },
        plotPoints: [
          { x: 1, y: 22.4, y2: 24.1, label: '1x' },
          { x: 2, y: 14.1, y2: 16.5, label: '2x' },
          { x: 4, y: 8.2, y2: 10.1, label: '4x' },
          { x: 8, y: 6.9, y2: 8.0, label: '8x' },
          { x: 16, y: 6.4, y2: 7.2, label: '16x' },
        ],
      },
      {
        id: 'art-note-sweep',
        type: 'NOTE',
        title: 'Intermediate Convergence Check',
        filename: 'sweep_checkpoint_notes.md',
        caption:
          'Intermediate checkpoint diagnostics for 8x and 16x dictionary expansion runs.',
        date: '6 hours ago',
        claimId: 'c1',
        claimText:
          'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
        experimentId: 'exp-2',
        findingSummary: '', // Running experiment: optional finding note
        noteContent:
          'Currently at epoch 45 of 100. Learning rates annealed by 0.5 at epoch 30. No NaN gradients detected in latent sparsification stage.',
      },
    ],
  },
  {
    id: 'exp-3',
    name: 'Subspace overlap and lateral inhibition simulation',
    questionId: 'q1',
    questionText: 'How does V1 encode natural scenes?',
    claimId: 'c1',
    claimText: 'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
    claimStatus: 'weak',
    status: 'planned',
    targetStatement:
      'Whether recurrent lateral inhibition is required to eliminate basis redundancy in overcomplete regimes.',
    date: 'Planned',
    artifacts: [],
  },
  {
    id: 'exp-4',
    name: 'Sparse autoencoder dictionary capacity sweep in transformer residual stream',
    questionId: 'q2',
    questionText: 'Is dictionary learning the same claim in NLP?',
    claimId: 'c3',
    claimText: 'Dictionary size controls feature superposition.',
    claimStatus: 'holds',
    status: 'done',
    targetStatement:
      'Whether scaling sparse autoencoder capacity past 16x eliminates polysemantic superposition without catastrophic reconstruction loss.',
    date: 'Oct 21, 2024',
    checkResult: {
      modelId: 'cx/gpt-5.6-sol',
      timestamp: 'checked 3 days ago',
      finding:
        'Target aligned: dictionary expansion directly measures linear superposition decay in transformer representations.',
      axes: [
        {
          label: 'TYPE',
          verdict: 'pass',
          detail: 'mechanistic intervention directly manipulates dictionary capacity',
        },
        {
          label: 'SCOPE',
          verdict: 'pass',
          detail: 'tested across residual streams of GPT-2 and Pythia architectures',
        },
        {
          label: 'TARGET',
          verdict: 'pass',
          detail: 'measures monosemantic feature recovery and interference error',
        },
      ],
    },
    artifacts: [
      {
        id: 'art-sae-plot-1',
        type: 'PLOT',
        title: 'Superposition Interference vs Dictionary Expansion Ratio',
        filename: 'superposition_interference_sweep.png',
        caption:
          'Interference error (MSE) plotted against SAE hidden expansion ratio (4x to 64x) across L0 sparsity targets.',
        date: 'Oct 14, 2024',
        claimId: 'c3',
        claimText: 'Dictionary size controls feature superposition.',
        experimentId: 'exp-4',
        findingSummary:
          'Expanding dictionary capacity past 16x reduces residual feature interference by 72% under fixed L0=32 sparsity constraints.',
        findingAuthor: 'user',
        plotLabels: {
          x: 'Dictionary Expansion (x)',
          y: 'Interference Loss (MSE x10⁻³)',
        },
        plotPoints: [
          { x: 4, y: 14.2, y2: 18.5, label: '4x' },
          { x: 8, y: 9.8, y2: 13.1, label: '8x' },
          { x: 16, y: 5.4, y2: 8.9, label: '16x' },
          { x: 32, y: 3.1, y2: 5.2, label: '32x' },
          { x: 64, y: 2.2, y2: 3.7, label: '64x' },
        ],
      },
      {
        id: 'art-sae-table-1',
        type: 'TABLE',
        title: 'Layer 8 Residual Stream Sparse Autoencoder Scaling',
        filename: 'sae_layer8_eval_metrics.csv',
        caption:
          'Reconstruction fidelity and monosemantic feature count across latent expansion configs.',
        date: 'Oct 18, 2024',
        claimId: 'c3',
        claimText: 'Dictionary size controls feature superposition.',
        experimentId: 'exp-4',
        findingSummary:
          'Latent feature interpretability score increases monotonically as dictionary expands from 4,096 to 65,536 features.',
        findingAuthor: 'user',
        tableHeaders: [
          'Config',
          'Expansion',
          'L0 Norm',
          'Loss Recovered',
          'Interference Score',
        ],
        tableRows: [
          ['cfg-4k-base', '4x (4,096)', '31.4', '86.2%', '0.342'],
          ['cfg-8k-med', '8x (8,192)', '32.1', '91.8%', '0.215'],
          ['cfg-16k-wide', '16x (16,384)', '30.8', '95.4%', '0.118'],
          ['cfg-32k-large', '32x (32,768)', '31.2', '97.6%', '0.064'],
        ],
        totalRows: 16,
      },
      {
        id: 'art-sae-note-1',
        type: 'NOTE',
        title: 'Feature Bifurcation and Orthogonality Thresholds',
        filename: 'bifurcation_analysis.md',
        caption:
          'Qualitative notes on polysemantic vector decomposition under 32x scaling.',
        date: 'Oct 21, 2024',
        claimId: 'c3',
        claimText: 'Dictionary size controls feature superposition.',
        experimentId: 'exp-4',
        findingSummary:
          'Polysemantic heads cleanly split into distinct sub-concept directions with mutual cosine similarity < 0.08.',
        findingAuthor: 'user',
        noteContent:
          'When scaling the dictionary expansion factor from 8x to 32x, polysemantic directions previously encoding merged syntax-semantics features cleanly split into distinct monosemantic basis directions. Mutual cosine angle between the newly resolved feature directions averages 86.4 degrees, verifying near-orthogonal geometric packing. Feature activation density shifts toward the true heavy-tailed log-normal distribution without requiring manual threshold re-tuning.',
      },
    ],
  },
];

