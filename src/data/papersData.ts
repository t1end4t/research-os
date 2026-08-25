import { PaperDoc } from '../types';

export const PAPERS_CATALOG: PaperDoc[] = [
  {
    id: 'p1',
    title: 'Sparse codes emerge from image statistics',
    authors: 'Olshausen, B. A. & Field, D. J.',
    year: 1996,
    citation: 'Nature 381, 607–609 (1996)',
    pageCount: 44,
    abstract:
      'The receptive fields of simple cells in mammalian primary visual cortex (V1) have been described as localized, oriented, and bandpass filters. Here we show that such receptive fields emerge naturally when a neural network is trained to find a sparse code for natural images. A sparse representation is one in which only a small fraction of the active units are utilized to represent any given input image patch. Under this optimization principle, the learned basis functions resemble spatial Gabor filters and wavelet-like primitives.',
    sections: [
      {
        id: 'sec-intro',
        heading: '1. Introduction and Theoretical Motivation',
        paragraphs: [
          {
            id: 'p1-par-1',
            text: 'A central problem in computational neuroscience is understanding the coding principles of early sensory representations. Barlow proposed that the role of sensory processing is to transform redundant input signals into a factorial, statistically independent representation. When natural images are analyzed under standard linear decorrelation techniques like Principal Component Analysis (PCA), the resulting components are global Fourier-like modes, failing to capture the localized, oriented properties characteristic of cortical receptive fields.',
          },
          {
            id: 'p1-par-2',
            text: 'We propose instead that the primary objective of early visual representations is sparsity: representing each image patch using the minimum number of active coefficients while minimizing mean squared reconstruction error. Sparsity reduces redundant multi-unit firing and increases the geometric orthogonality of activations across distinct natural stimuli.',
            linkedClaimId: 'c1',
          },
        ],
      },
      {
        id: 'sec-model',
        heading: '2. Statistical Formulation and Sparse Objective',
        paragraphs: [
          {
            id: 'p1-par-3',
            text: 'Let an image patch I(x,y) be represented by a linear superposition of basis functions: I(x,y) = sum_i a_i * phi_i(x,y) + epsilon(x,y), where a_i represents the scalar activation coefficient of basis function phi_i, and epsilon represents residual reconstruction noise. To enforce sparsity, we introduce a non-quadratic cost function S(a_i) that heavily penalizes non-zero coefficients.',
          },
          {
            id: 'p1-par-4',
            text: 'In our numerical simulations, we minimize the total energy function: E = |I - Phi * a|^2 + lambda * sum_i log(1 + (a_i / sigma)^2). The first term preserves high-fidelity image reconstruction, while the Cauchy prior term drives inactive coefficients strictly toward zero.',
            linkedClaimId: 'c1',
          },
          {
            id: 'p1-par-5',
            text: 'Optimization proceeded across 16x16 pixel natural image patches sampled from calibrated outdoor scenes. After 50,000 gradient updates, the learned basis functions converged onto spatially localized, oriented, multi-scale wavelets strikingly congruent with simple cell receptive fields in mammalian area V1.',
          },
        ],
      },
      {
        id: 'sec-discussion',
        heading: '3. Emergent Properties and Overlap Analysis',
        paragraphs: [
          {
            id: 'p1-par-6',
            text: 'Crucially, the learned coordinate frame exhibits very low mutual co-activation across arbitrary natural stimuli. Because coefficients are sparse, simultaneous activation of overlapping basis vectors is exceedingly rare in practice, leading to minimal cross-talk during associative transmission.',
            linkedClaimId: 'c1',
          },
          {
            id: 'p1-par-7',
            text: 'However, while our empirical model establishes that sparse priors generate Gabor-like filters, it does not experimentally isolate or manipulate vector overlap independently of reconstruction fidelity. Further causal investigations are required to separate overlap from direct signal degradation.',
          },
        ],
      },
    ],
    initialMarks: [
      {
        id: 'mark-1',
        paragraphId: 'p1-par-2',
        yPercent: 18,
        type: 'emerald',
        label: 'Sparsity hypothesis',
        snippet: 'Sparsity reduces redundant multi-unit firing and increases the geometric orthogonality...',
        claimId: 'c1',
      },
      {
        id: 'mark-2',
        paragraphId: 'p1-par-4',
        yPercent: 46,
        type: 'amber',
        label: 'Energy formulation',
        snippet: 'E = |I - Phi * a|^2 + lambda * sum_i log(1 + (a_i / sigma)^2)...',
        claimId: 'c1',
      },
      {
        id: 'mark-3',
        paragraphId: 'p1-par-6',
        yPercent: 78,
        type: 'emerald',
        label: 'Low mutual co-activation',
        snippet: 'Simultaneous activation of overlapping basis vectors is exceedingly rare...',
        claimId: 'c1',
      },
    ],
  },
  {
    id: 'p2',
    title: 'Overlap correlates with recall error',
    authors: 'Ahmad, S. & Scheinkman, L.',
    year: 2019,
    citation: 'Journal of Cognitive Systems 14, 112–129 (2019)',
    pageCount: 32,
    abstract:
      'We examine high-dimensional vector representations across associative memory networks. Through extensive observational logging of sequential retrieval tasks, we demonstrate a strong statistical correlation between representational subspace overlap and catastrophic interference during sequential weight updates.',
    sections: [
      {
        id: 'sec-p2-1',
        heading: '1. Associative Interference in High Dimensions',
        paragraphs: [
          {
            id: 'p2-par-1',
            text: 'When distributed representations share overlapping non-zero dimensions, gradient descent updates applied to newly presented items perturb synaptic weights that encode previously stored memories.',
          },
          {
            id: 'p2-par-2',
            text: 'Across 10,000 simulated associative recall trials, Pearson correlation between cosine similarity of memory vectors and recall degradation was r = 0.84 (p < 0.001).',
            linkedClaimId: 'c1',
          },
        ],
      },
    ],
    initialMarks: [
      {
        id: 'mark-p2-1',
        paragraphId: 'p2-par-2',
        yPercent: 40,
        type: 'amber',
        label: 'Correlational finding',
        snippet: 'Pearson correlation between cosine similarity and recall degradation was r = 0.84...',
        claimId: 'c1',
      },
    ],
  },
  {
    id: 'p3',
    title: 'Toy models of superposition',
    authors: 'Elhage, N., Hume, T., Olsson, C., et al.',
    year: 2022,
    citation: 'Anthropic Transformer Circuit Thread (2022)',
    pageCount: 68,
    abstract:
      'Neural networks often represent more features than they have dimensions by storing them in superposition. We construct minimal toy models to analyze when and why superposition occurs as a function of feature sparsity and capacity.',
    sections: [
      {
        id: 'sec-p3-1',
        heading: '1. Overcomplete Feature Geometry',
        paragraphs: [
          {
            id: 'p3-par-1',
            text: 'Linear representations in neural networks can pack almost-orthogonal vectors into d dimensions when features are sparse. As sparsity increases, the maximum number of non-interfering features scales superlinearly with dimension.',
            linkedClaimId: 'c3',
          },
          {
            id: 'p3-par-2',
            text: 'We demonstrate that when feature activations are sparse (L0 << d), interference terms between non-orthogonal directions remain bounded below the noise threshold of downstream nonlinearities.',
            linkedClaimId: 'c3',
          },
        ],
      },
    ],
    initialMarks: [
      {
        id: 'mark-p3-1',
        paragraphId: 'p3-par-1',
        yPercent: 30,
        type: 'emerald',
        label: 'Superposition capacity',
        snippet: 'Linear representations can pack almost-orthogonal vectors into d dimensions...',
        claimId: 'c3',
      },
    ],
  },
  {
    id: 'p4',
    title: 'Towards Monosemanticity: Decomposing Language Models',
    authors: 'Bricken, T., Templeton, A., Batson, J., et al.',
    year: 2023,
    citation: 'Anthropic Research Publication (2023)',
    pageCount: 52,
    abstract:
      'We apply sparse autoencoders to extract interpretable, monosemantic features from language model activations. By expanding the dictionary size beyond the residual stream dimension, polysemantic neurons decompose into distinct, interpretable feature directions.',
    sections: [
      {
        id: 'sec-p4-1',
        heading: '1. Dictionary Expansion and Feature Resolution',
        paragraphs: [
          {
            id: 'p4-par-1',
            text: 'Sparse autoencoders with an expansion factor of 8x to 32x successfully disentangle superimposed features into highly interpretable latent directions with minimal reconstruction error.',
            linkedClaimId: 'c3',
          },
          {
            id: 'p4-par-2',
            text: 'Scaling the dictionary capacity directly mitigates feature cross-talk and prevents polysemantic interference across diverse textual domains.',
            linkedClaimId: 'c3',
          },
        ],
      },
    ],
    initialMarks: [
      {
        id: 'mark-p4-1',
        paragraphId: 'p4-par-1',
        yPercent: 35,
        type: 'emerald',
        label: 'Monosemantic decomposition',
        snippet: 'Sparse autoencoders successfully disentangle superimposed features into highly interpretable latent directions...',
        claimId: 'c3',
      },
    ],
  },
  {
    id: 'p5',
    title: 'Scaling and evaluating sparse autoencoders',
    authors: 'Gao, L., Goh, G., Templeton, A., et al.',
    year: 2024,
    citation: 'OpenAI & Anthropic Joint Preprint (2024)',
    pageCount: 48,
    abstract:
      'We investigate scaling laws for sparse autoencoders across model sizes up to frontier transformer systems. We establish that dictionary size and sparsity penalties systematically govern the Pareto frontier between reconstruction loss and feature specificity.',
    sections: [
      {
        id: 'sec-p5-1',
        heading: '1. Scaling Frontiers for Superposition Control',
        paragraphs: [
          {
            id: 'p5-par-1',
            text: 'Larger dictionary capacities consistently improve the trade-off between L0 sparsity and downstream loss recovered, demonstrating that dictionary size controls feature superposition at scale.',
            linkedClaimId: 'c3',
          },
        ],
      },
    ],
    initialMarks: [
      {
        id: 'mark-p5-1',
        paragraphId: 'p5-par-1',
        yPercent: 40,
        type: 'emerald',
        label: 'Scaling Pareto frontier',
        snippet: 'Larger dictionary capacities consistently improve the trade-off between L0 sparsity and downstream loss recovered...',
        claimId: 'c3',
      },
    ],
  },
];

export const EVIDENCE_TO_PAPER_MAP: Record<string, string> = {
  e1: 'p1',
  e2: 'p2',
  e4: 'p3',
  e5: 'p4',
  e6: 'p5',
};

export function getPaperDoc(paperIdOrEvidenceId: string): PaperDoc | undefined {
  const mappedId = EVIDENCE_TO_PAPER_MAP[paperIdOrEvidenceId] || paperIdOrEvidenceId;
  const direct = PAPERS_CATALOG.find((p) => p.id === mappedId || p.id === paperIdOrEvidenceId);
  if (direct) return direct;
  return undefined;
}
