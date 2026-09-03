import {
  Question,
  Claim,
  Evidence,
  Link,
  SurveyOpenProblem,
  SurveyCandidateQuestion,
  Paper,
  Experiment
} from '../types';

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: 'Does sparse coding reduce interference?',
    tags: ['tinyml', 'memory'],
    createdAt: 1700000000000,
    author: 'user'
  },
  {
    id: 'q2',
    title: 'Is dictionary learning the same claim in NLP?',
    tags: [],
    createdAt: 1700000100000,
    author: 'user'
  },
  {
    id: 'q3',
    title: 'Which readout model fits the CA3 data?',
    tags: ['tinyml'],
    createdAt: 1700000200000,
    author: 'user'
  }
];

export const INITIAL_CLAIMS: Claim[] = [
  {
    id: 'c1',
    text: 'Sparsity lowers overlap, and overlap causes interference.',
    rejected: false,
    createdAt: 1700000300000,
    author: 'user'
  },
  {
    id: 'c2',
    text: 'Hippocampal codes are sparse for this reason.',
    rejected: false,
    createdAt: 1700000400000,
    author: 'user'
  },
  {
    id: 'c3',
    text: 'Dictionary size controls feature superposition.',
    rejected: false,
    createdAt: 1700000500000,
    author: 'user'
  }
];

export const INITIAL_EVIDENCE: Evidence[] = [
  {
    id: 'e1',
    title: 'Sparse codes emerge from image statistics',
    origin: 'literature',
    form: 'measurement',
    citation: 'Olshausen & Field 1996',
    paperId: 'p1',
    createdAt: 1700000600000,
    author: 'user'
  },
  {
    id: 'e2',
    title: 'Overlap correlates with recall error',
    origin: 'literature',
    form: 'measurement',
    citation: 'Ahmad & Scheinkman 2019',
    paperId: 'p2',
    createdAt: 1700000700000,
    author: 'user'
  },
  {
    id: 'e4',
    title: 'Toy models of superposition',
    origin: 'literature',
    form: 'derivation',
    citation: 'Elhage et al. 2022',
    paperId: 'p3',
    validity: 'valid',
    validityReason: 'Analytic derivation holds on 2D toy model with orthogonal projections under sparsity penalty',
    createdAt: 1700000800000,
    author: 'user'
  },
  {
    id: 'e5',
    title: 'Towards Monosemanticity: Decomposing Language Models',
    origin: 'literature',
    form: 'measurement',
    citation: 'Bricken et al. 2023',
    paperId: 'p4',
    createdAt: 1700000900000,
    author: 'user'
  },
  {
    id: 'e6',
    title: 'Scaling and evaluating sparse autoencoders',
    origin: 'literature',
    form: 'measurement',
    citation: 'Gao et al. 2024',
    paperId: 'p5',
    createdAt: 1700001000000,
    author: 'user'
  }
];

export const INITIAL_LINKS: Link[] = [
  {
    id: 'q1--c1',
    kind: 'question-claim',
    parentId: 'q1',
    childId: 'c1',
    status: 'weak',
    userReason: 'Sparsity geometrically forces representations into orthogonal subspaces, which prevents weight corruption during sequential learning.',
    check: {
      modelId: '[model:unknown]',
      tag: 'TYPE MISMATCH',
      tagColor: 'amber',
      note: 'Your claim is causal. Both findings are correlational - neither manipulates overlap while holding sparsity fixed.',
      items: [
        {
          label: 'Type',
          status: 'mismatch',
          detail: 'Causal claim backed only by observational correlations'
        },
        {
          label: 'Scope',
          status: 'partial',
          detail: 'Vision encoding to associative recall tasks'
        },
        {
          label: 'Target',
          status: 'pass',
          detail: 'Interference reduction via orthogonal activation'
        }
      ],
      checkedAt: 1700001100000
    },
    createdAt: 1700000350000,
    author: 'user'
  },
  {
    id: 'q1--c2',
    kind: 'question-claim',
    parentId: 'q1',
    childId: 'c2',
    status: 'missing',
    userReason: 'Dentate gyrus granule cells maintain low firing probability (~2-5%) to prevent memory interference.',
    check: {
      modelId: '[model:unknown]',
      tag: 'NO EVIDENCE LINKED',
      tagColor: 'red',
      note: 'This claim is an untested teleological assertion. No empirical papers or experimental manipulations are currently attached to this node.',
      items: [
        {
          label: 'Type',
          status: 'mismatch',
          detail: 'Hypothesis without supporting citations or tests'
        },
        {
          label: 'Scope',
          status: 'partial',
          detail: 'Dentate gyrus pattern separation circuits'
        },
        {
          label: 'Target',
          status: 'partial',
          detail: 'Episodic memory interference prevention'
        }
      ],
      checkedAt: 1700001200000
    },
    createdAt: 1700000450000,
    author: 'user'
  },
  {
    id: 'q2--c3',
    kind: 'question-claim',
    parentId: 'q2',
    childId: 'c3',
    status: 'holds',
    userReason: 'Overcomplete sparse autoencoders disentangle polysemantic activations into monosemantic feature directions.',
    check: {
      modelId: '[model:unknown]',
      tag: 'EMPIRICAL SUPPORT CONFIRMED',
      tagColor: 'emerald',
      note: 'All three foundational papers demonstrate that scaling the dictionary capacity directly mitigates superposition interference in transformer language models.',
      items: [
        {
          label: 'Type',
          status: 'pass',
          detail: 'Mechanistic and empirical proofs with dictionary interventions'
        },
        {
          label: 'Scope',
          status: 'pass',
          detail: 'Transformer residual streams and MLP layers'
        },
        {
          label: 'Target',
          status: 'pass',
          detail: 'Direct control over linear feature superposition'
        }
      ],
      checkedAt: 1700001300000
    },
    createdAt: 1700000550000,
    author: 'user'
  },
  {
    id: 'c1--e1',
    kind: 'claim-evidence',
    parentId: 'c1',
    childId: 'e1',
    status: 'holds',
    userReason: 'Sparse coding produces localized orthogonal receptive fields from natural scene statistics.',
    createdAt: 1700000650000,
    author: 'user'
  },
  {
    id: 'c1--e2',
    kind: 'claim-evidence',
    parentId: 'c1',
    childId: 'e2',
    status: 'holds',
    userReason: 'Empirical correlation confirms overlap increases recall error in high-dimensional representations.',
    createdAt: 1700000750000,
    author: 'user'
  },
  {
    id: 'c3--e4',
    kind: 'claim-evidence',
    parentId: 'c3',
    childId: 'e4',
    status: 'holds',
    userReason: 'Mathematical toy models establish superlinear scaling of feature capacity with sparsity.',
    createdAt: 1700000850000,
    author: 'user'
  },
  {
    id: 'c3--e5',
    kind: 'claim-evidence',
    parentId: 'c3',
    childId: 'e5',
    status: 'holds',
    userReason: 'Expanding autoencoder dictionary decomposes polysemantic transformer representations.',
    createdAt: 1700000950000,
    author: 'user'
  },
  {
    id: 'c3--e6',
    kind: 'claim-evidence',
    parentId: 'c3',
    childId: 'e6',
    status: 'holds',
    userReason: 'Frontier scaling laws confirm larger dictionary capacity resolves superposition trade-offs.',
    createdAt: 1700001050000,
    author: 'user'
  }
];

export const INITIAL_OPEN_PROBLEMS: SurveyOpenProblem[] = [
  {
    id: 'op-1',
    text: 'On-device INT4 quantization degrades attention map sparsity unpredictably across transformer layers.',
    citation: 'Lin et al. 2023, MLSys',
    createdAt: 1700000000000
  },
  {
    id: 'op-2',
    text: 'Microcontroller SRAM limits force activation swapping that dominates compute latency by up to 8x.',
    citation: 'Zhang & Banerjee 2024, TinyML Summit',
    createdAt: 1700000100000,
    candidateId: 'cq-1'
  },
  {
    id: 'op-3',
    text: 'Hardware cycle timers lack standardized baseline clocks across Cortex-M4 and ESP32 benchmarks.',
    citation: 'TinyML Benchmark Committee 2023',
    createdAt: 1700000150000,
    candidateId: 'cq-1'
  },
  {
    id: 'op-4',
    text: 'Non-volatile FeRAM write endurance limits on-chip continual weight updates to under 10k steps.',
    citation: 'Park & Chen 2023, IEEE EDL',
    createdAt: 1700000200000,
    candidateId: 'cq-3'
  },
  {
    id: 'op-5',
    text: 'Dynamic voltage-frequency scaling during inference induces non-deterministic timing jitter in micro-wakeups.',
    citation: 'Gomez et al. 2024, RTAS',
    createdAt: 1700000250000,
    candidateId: 'cq-1'
  },
  {
    id: 'op-6',
    text: 'Direct memory access channel collisions corrupt sparse weight pre-fetches during asynchronous tensor ops.',
    citation: 'Weng et al. 2023, DAC',
    createdAt: 1700000300000,
    candidateId: 'cq-2'
  },
  {
    id: 'op-7',
    text: 'Weight pruning masks derived from static saliency metrics fail to predict runtime throughput on systolic arrays with structured sparsity constraints.',
    citation: 'Rao & Sze 2024, ISCA',
    createdAt: 1700000350000
  },
  {
    id: 'op-8',
    text: 'Thermal throttling on enclosed sensor nodes causes non-linear clock drift during continuous acoustic keyword spotting runs.',
    citation: 'Alvarez & Muller 2024, SenSys',
    createdAt: 1700000400000
  },
  {
    id: 'op-9',
    text: 'Mixed-precision activation schedules cause unexpected register spilling when compiling for constrained RV32IMAF vector extensions.',
    citation: 'Lombardi et al. 2024, DATE',
    createdAt: 1700000450000,
    candidateId: 'cq-2'
  },
  {
    id: 'op-10',
    text: 'Energy harvesters introduce brownout voltage sags that reset volatile accumulator registers mid-layer computation.',
    citation: 'Hester & Sorber 2023, ASPLOS',
    createdAt: 1700000500000,
    candidateId: 'cq-3'
  },
  {
    id: 'op-11',
    text: 'Quantized activation outlier suppression algorithms increase static SRAM overhead beyond the savings achieved by 4-bit weight compression.',
    citation: 'Dettmers et al. 2023, NeurIPS',
    createdAt: 1700000550000
  },
  {
    id: 'op-12',
    text: 'Compiler layer-fusion heuristics produce degenerate memory access patterns on shared L1 cache scratchpads under concurrent sensor DMA transfers.',
    citation: 'Seshadri et al. 2024, MICRO',
    createdAt: 1700000600000,
    candidateId: 'cq-2'
  }
];

export const INITIAL_CANDIDATE_QUESTIONS: SurveyCandidateQuestion[] = [
  {
    id: 'cq-1',
    title: 'Are TinyML latency numbers comparable across devices?',
    openProblemIds: ['op-2', 'op-3', 'op-5'],
    createdAt: 1700000250000
  },
  {
    id: 'cq-2',
    title: 'Does runtime memory contention dominate compute speedup in sub-milliwatt accelerators?',
    openProblemIds: ['op-5', 'op-6', 'op-9', 'op-12'],
    createdAt: 1700000300000
  },
  {
    id: 'cq-3',
    title: 'Can non-volatile on-chip storage support continual learning without destructive wear?',
    openProblemIds: ['op-4', 'op-6', 'op-10'],
    createdAt: 1700000350000
  }
];

export const PAPERS: Paper[] = [
  {
    id: 'p1',
    title: 'Sparse codes emerge from image statistics',
    authors: 'Olshausen, B. A. & Field, D. J.',
    year: 1996,
    citation: 'Nature 381, 607–609 (1996)',
    pageCount: 44,
    sections: [
      {
        id: 'sec-intro',
        title: '1. Introduction and Theoretical Motivation',
        paragraphs: [
          { id: 'p1-par-1' },
          { id: 'p1-par-2', linkedClaimId: 'c1' }
        ]
      },
      {
        id: 'sec-model',
        title: '2. Statistical Formulation and Sparse Objective',
        paragraphs: [
          { id: 'p1-par-3' },
          { id: 'p1-par-4', linkedClaimId: 'c1' },
          { id: 'p1-par-5' }
        ]
      },
      {
        id: 'sec-discussion',
        title: '3. Emergent Properties and Overlap Analysis',
        paragraphs: [
          { id: 'p1-par-6', linkedClaimId: 'c1' },
          { id: 'p1-par-7' }
        ]
      }
    ],
    markdown: `### Abstract
The receptive fields of simple cells in mammalian primary visual cortex (V1) have been described as localized, oriented, and bandpass filters. Here we show that such receptive fields emerge naturally when a neural network is trained to find a sparse code for natural images. A sparse representation is one in which only a small fraction of the active units are utilized to represent any given input image patch. Under this optimization principle, the learned basis functions resemble spatial Gabor filters and wavelet-like primitives.

### 1. Introduction and Theoretical Motivation
A central problem in computational neuroscience is understanding the coding principles of early sensory representations. Barlow proposed that the role of sensory processing is to transform redundant input signals into a factorial, statistically independent representation. When natural images are analyzed under standard linear decorrelation techniques like Principal Component Analysis (PCA), the resulting components are global Fourier-like modes, failing to capture the localized, oriented properties characteristic of cortical receptive fields.

We propose instead that the primary objective of early visual representations is sparsity: representing each image patch using the minimum number of active coefficients while minimizing mean squared reconstruction error. Sparsity reduces redundant multi-unit firing and increases the geometric orthogonality of activations across distinct natural stimuli.

### 2. Statistical Formulation and Sparse Objective
Let an image patch I(x,y) be represented by a linear superposition of basis functions: I(x,y) = sum_i a_i * phi_i(x,y) + epsilon(x,y), where a_i represents the scalar activation coefficient of basis function phi_i, and epsilon represents residual reconstruction noise. To enforce sparsity, we introduce a non-quadratic cost function S(a_i) that heavily penalizes non-zero coefficients.

In our numerical simulations, we minimize the total energy function: E = |I - Phi * a|^2 + lambda * sum_i log(1 + (a_i / sigma)^2). The first term preserves high-fidelity image reconstruction, while the Cauchy prior term drives inactive coefficients strictly toward zero.

Optimization proceeded across 16x16 pixel natural image patches sampled from calibrated outdoor scenes. After 50,000 gradient updates, the learned basis functions converged onto spatially localized, oriented, multi-scale wavelets strikingly congruent with simple cell receptive fields in mammalian area V1.

### 3. Emergent Properties and Overlap Analysis
Crucially, the learned coordinate frame exhibits very low mutual co-activation across arbitrary natural stimuli. Because coefficients are sparse, simultaneous activation of overlapping basis vectors is exceedingly rare in practice, leading to minimal cross-talk during associative transmission.

However, while our empirical model establishes that sparse priors generate Gabor-like filters, it does not experimentally isolate or manipulate vector overlap independently of reconstruction fidelity. Further causal investigations are required to separate overlap from direct signal degradation.`
  },
  {
    id: 'p2',
    title: 'Overlap correlates with recall error',
    authors: 'Ahmad, S. & Scheinkman, L.',
    year: 2019,
    citation: 'Journal of Cognitive Systems 14, 112–129 (2019)',
    pageCount: 32,
    sections: [
      {
        id: 'sec-p2-1',
        title: 'Empirical Overlap Quantification',
        paragraphs: [
          { id: 'p2-par-1' },
          { id: 'p2-par-2', linkedClaimId: 'c1' }
        ]
      }
    ],
    markdown: `### Abstract
Associative memory architectures store memories as attractor states in high-dimensional vector spaces. A central operational hazard in continuous attractor networks is cross-talk or catastrophic forgetting caused by mutual vector alignment. Here we measure the statistical correlation between representation overlap and retrieval error in cortical associative memories.

### Representation Orthogonality and Error Scaling
When multiple synthetic patterns are sequentially encoded into a distributed recurrent substrate, the probability of bit flips during associative recall scales exponentially with pairwise cosine similarity. Specifically, when active unit overlap between distinct representations exceeds 8%, retrieval error jumps from 0.04 to 0.42. 

Our empirical measurements across 10,000 simulated retrieval episodes confirm that sparse sub-sampling of feature dimensions naturally maintains pairwise overlap below the critical cross-talk percolation threshold.`
  },
  {
    id: 'p3',
    title: 'Toy models of superposition',
    authors: 'Elhage, N., Hume, T., Olsson, C., et al.',
    year: 2022,
    citation: 'Anthropic Transformer Circuit Thread (2022)',
    pageCount: 68,
    sections: [
      {
        id: 'sec-p3-1',
        title: '1. Geometric Framework of Superposition',
        paragraphs: [
          { id: 'p3-par-1', linkedClaimId: 'c3' },
          { id: 'p3-par-2', linkedClaimId: 'c3' }
        ]
      }
    ],
    markdown: `### Abstract
Neural networks frequently represent more features than they have dimensions, a phenomenon known as superposition. Using analytically tractable toy models, we formalize the conditions under which neural networks pack almost-orthogonal features into low-dimensional vector spaces.

### Geometry of Overcomplete Dictionaries
Consider a linear autoencoder mapping m features into d dimensions where m > d. When features are sparse (active with probability p << 1), the network organizes feature vectors as an antipodal spherical code or regular polytope. Interference between non-orthogonal features acts as bounded noise that can be suppressed by nonlinear activation functions like ReLU.

Our analytic solutions prove that feature capacity scales superlinearly with sparsity: as p -> 0, the maximum number of stable features m that can be faithfully recovered from d dimensions grows as O(exp(d)).`
  },
  {
    id: 'p4',
    title: 'Towards Monosemanticity: Decomposing Language Models',
    authors: 'Bricken, T., Templeton, A., Batson, J., et al.',
    year: 2023,
    citation: 'Anthropic Research Publication (2023)',
    pageCount: 52,
    sections: [
      {
        id: 'sec-p4-1',
        title: 'Dictionary Learning on Residual Stream',
        paragraphs: [
          { id: 'p4-par-1', linkedClaimId: 'c3' },
          { id: 'p4-par-2', linkedClaimId: 'c3' }
        ]
      }
    ],
    markdown: `### Abstract
Individual neurons in frontier language models are notoriously polysemantic, responding to a mixture of completely unrelated concepts. We demonstrate that Sparse Autoencoders (SAEs) with overcomplete dictionaries can extract monosemantic feature directions from transformer residual activations.

### Resolving Polysemanticity via Sparse Expansion
We train sparse autoencoders on the activations of a one-layer transformer with 512 dimensions, expanding the dictionary to 4,096 and 16,384 features. Under L1 regularization, the learned features correspond to clean, human-interpretable concepts such as DNA sequences, Arabic script, and legal citations. 

Crucially, increasing dictionary width from 1x to 32x directly reduces feature superposition interference without degrading language model cross-entropy loss upon feature reconstruction.`
  },
  {
    id: 'p5',
    title: 'Scaling and evaluating sparse autoencoders',
    authors: 'Gao, L., Goh, G., Templeton, A., et al.',
    year: 2024,
    citation: 'OpenAI & Anthropic Joint Preprint (2024)',
    pageCount: 48,
    sections: [
      {
        id: 'sec-p5-1',
        title: 'Scaling Laws for Monosemantic Dictionaries',
        paragraphs: [
          { id: 'p5-par-1', linkedClaimId: 'c3' }
        ]
      }
    ],
    markdown: `### Abstract
We present empirical scaling laws for sparse autoencoders trained across large language models ranging from 125M to 16B parameters. We assess feature fidelity using automated interpretability, downstream intervention efficacy, and cross-entropy reconstruction loss.

### Dictionary Scaling Curves
Across all parameter scales, the trade-off between reconstruction error and sparsity follows clean power-law behavior with respect to autoencoder width. Expanding dictionary capacity to 65,536 features allows fine-grained separation of subtle polysemantic nuances while driving reconstruction loss closer to the uncompressed activation baseline.`
  }
];

export const INITIAL_EXPERIMENTS: Experiment[] = [
  {
    id: 'exp-1',
    claimId: 'c1',
    questionId: 'q1',
    title: 'Orthogonal activation ablation on sequential MNIST',
    status: 'planned',
    targetMetric: 'Weight gradient dot product (< 0.05)',
    baseline: 'Dense fully connected layer without sparsity penalty',
    prediction: 'Forcing L1 activity regularization will reduce backward interference by >= 35%',
    failureCondition: 'Catastrophic forgetting exceeds 15% across tasks A and B',
    scope: 'Hopfield-style memory networks under 1M parameters',
    artifacts: []
  },
  {
    id: 'exp-2',
    claimId: 'c3',
    questionId: 'q2',
    title: 'SAE dictionary capacity scaling on GPT-2 small residual stream',
    status: 'planned',
    targetMetric: 'Cross-entropy loss recovered vs L0 sparsity',
    baseline: 'Standard k-sparse autoencoder at 4x expansion',
    prediction: 'Expansion factor from 8x to 64x will increase monosemantic feature fraction linearly',
    failureCondition: 'Dead feature ratio exceeds 40%',
    scope: 'Layer 8 residual stream across OpenWebText eval set',
    artifacts: []
  }
];
