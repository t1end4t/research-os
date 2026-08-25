import { ExperimentGroup } from '../types';

export const INITIAL_EXPERIMENTS_DATA: ExperimentGroup[] = [
  {
    id: 'exp-group-1',
    name: 'subspace overlap manipulation',
    claimId: 'c1',
    claimText: 'Sparsity lowers overlap, and overlap causes interference.',
    claimStatus: 'weak',
    status: 'planned',
    artifacts: [],
  },
  {
    id: 'exp-group-2',
    name: 'dictionary sweep',
    claimId: 'c3',
    claimText: 'Dictionary size controls feature superposition.',
    claimStatus: 'holds',
    status: 'done',
    artifacts: [
      {
        id: 'art-plot-1',
        type: 'PLOT',
        title: 'Superposition Interference vs Dictionary Expansion Ratio',
        caption: 'Interference error (MSE) plotted against SAE hidden expansion ratio (4x to 64x) across L0 sparsity targets.',
        date: 'Oct 14, 2024',
        claimId: 'c3',
        claimText: 'Dictionary size controls feature superposition.',
        findingSummary: 'Expanding dictionary capacity past 16x reduces residual feature interference by 72% under fixed L0=32 sparsity constraints.',
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
        id: 'art-table-1',
        type: 'TABLE',
        title: 'Layer 8 Residual Stream Sparse Autoencoder Scaling',
        caption: 'Reconstruction fidelity and monosemantic feature count across latent expansion configs.',
        date: 'Oct 18, 2024',
        claimId: 'c3',
        claimText: 'Dictionary size controls feature superposition.',
        findingSummary: 'Latent feature interpretability score increases monotonically as dictionary expands from 4,096 to 65,536 features.',
        tableHeaders: ['Config', 'Expansion', 'L0 Norm', 'Loss Recovered', 'Interference Score'],
        tableRows: [
          ['cfg-4k-base', '4x (4,096)', '31.4', '86.2%', '0.342'],
          ['cfg-8k-med', '8x (8,192)', '32.1', '91.8%', '0.215'],
          ['cfg-16k-wide', '16x (16,384)', '30.8', '95.4%', '0.118'],
          ['cfg-32k-large', '32x (32,768)', '31.2', '97.6%', '0.064'],
        ],
        totalRows: 16,
      },
      {
        id: 'art-note-1',
        type: 'NOTE',
        title: 'Feature Bifurcation and Orthogonality Thresholds',
        caption: 'Qualitative notes on polysemantic vector decomposition under 32x scaling.',
        date: 'Oct 21, 2024',
        claimId: 'c3',
        claimText: 'Dictionary size controls feature superposition.',
        findingSummary: 'Polysemantic heads cleanly split into distinct sub-concept directions with mutual cosine similarity < 0.08.',
        noteContent:
          'When scaling the dictionary expansion factor from 8x to 32x, polysemantic directions previously encoding merged syntax-semantics features cleanly split into distinct monosemantic basis directions. Mutual cosine angle between the newly resolved feature directions averages 86.4 degrees, verifying near-orthogonal geometric packing. Feature activation density shifts toward the true heavy-tailed log-normal distribution without requiring manual threshold re-tuning.',
      },
    ],
  },
];
