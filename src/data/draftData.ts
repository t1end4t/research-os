import { DraftManuscript } from '../types';

export const INITIAL_DRAFT_MANUSCRIPT: DraftManuscript = {
  title: 'Sparse coding and the emergence of oriented receptive fields',
  sections: [
    {
      id: 'sec-1',
      title: '1. Problem and central claim',
      purpose: 'Establish why linear receptive field models fail and state the sparse coding hypothesis.',
      prose: `Classical linear receptive field models explain responses to simple artificial stimuli such as oriented bars and sinusoidal gratings, but fail to account for neural behavior under natural scene statistics. Receptive fields in primary visual cortex (V1) exhibit prominent spatial localization, orientation selectivity, and bandpass tuning.

The central hypothesis considered here is that sparse coding of natural images provides the computational principle underlying this tuning profile. Under an overcomplete dictionary representation, biological networks minimize reconstruction loss while penalizing activation density, forcing neurons to represent independent structural components of the visual environment.`,
      placedReferences: [
        {
          id: 'ref-c1',
          targetType: 'claim',
          targetId: 'c1',
          placedVersion: 2, // Claim is currently v3 -> demonstrates drift!
          anchorCode: 'C1',
          placedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 3,
        },
        {
          id: 'ref-e1',
          targetType: 'evidence',
          targetId: 'e1',
          placedVersion: 1,
          anchorCode: 'E1',
          placedTimestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
        },
      ],
      placedArtifacts: [],
    },
    {
      id: 'sec-2',
      title: '2. Natural-image statistics',
      purpose: 'Establish the statistical properties of natural images that drive sparsity.',
      prose: `Natural images are dominated by low spatial frequencies and non-Gaussian higher-order statistical dependencies. Standard principal component analysis (PCA) yields global Fourier-like basis functions rather than localized edge filters because it captures only second-order pairwise correlations.

By optimizing a Cauchy or L1 sparsity penalty across unwhitened and whitened natural image ensembles, the learning dynamic shifts from global variance maximization to local independent feature extraction.`,
      placedReferences: [
        {
          id: 'ref-e1-sec2',
          targetType: 'evidence',
          targetId: 'e1',
          placedVersion: 1,
          anchorCode: 'E1',
          placedTimestamp: Date.now() - 1000 * 60 * 60 * 24,
        },
      ],
      placedArtifacts: [],
    },
    {
      id: 'sec-3',
      title: '3. Model and experiment',
      purpose: 'Describe the objective function and optimization dynamics.',
      prose: `The generative model reconstructs an image patch as a linear combination of basis vectors with an additive Cauchy prior over coefficients. Optimization was performed over 200,000 iterations using alternating gradient descent on the basis functions and conjugate gradient minimization on coefficient sparsity.

We measured basis function profiles across dictionary dimensions spanning from critically complete (1x) to 4x overcomplete configurations.`,
      placedReferences: [
        {
          id: 'ref-c1-sec3',
          targetType: 'claim',
          targetId: 'c1',
          placedVersion: 3,
          anchorCode: 'C1',
          placedTimestamp: Date.now() - 1000 * 60 * 60 * 12,
        },
      ],
      placedArtifacts: [
        {
          id: 'art-ref-1',
          artifactId: 'art-plot-1',
          artifactType: 'PLOT',
          localNumber: 1,
          caption: 'Figure 1: Spatial frequency response and orientation tuning profiles of learned 256-dimensional basis filters compared against physiological simple-cell measurements in macaque V1.',
          anchorCode: 'F1',
        },
      ],
    },
    {
      id: 'sec-4',
      title: '4. Results',
      purpose: 'Establish whether the learned representation matches the properties attributed to V1 simple cells.',
      prose: `Learned receptive fields converged to localized, oriented Gabor-like filters matching physiological simple-cell profiles in macaque V1 across orientation bandwidth (38.4° vs 41.2°) and aspect ratio (1.82 vs 1.95).

However, quantitative comparison reveals discrepancies in the high-frequency cutoff regime that require careful delineation.`,
      placedReferences: [
        {
          id: 'ref-c1-sec4',
          targetType: 'claim',
          targetId: 'c1',
          placedVersion: 3,
          anchorCode: 'C1',
          placedTimestamp: Date.now() - 1000 * 60 * 60 * 6,
        },
      ],
      placedArtifacts: [
        {
          id: 'art-ref-2',
          artifactId: 'art-table-1',
          artifactType: 'TABLE',
          localNumber: 1,
          caption: 'Table 1: Quantitative parameter comparison between learned sparse basis functions and single-unit macaque V1 physiology recordings across spatial tuning parameters.',
          anchorCode: 'T1',
        },
      ],
    },
    {
      id: 'sec-5',
      title: '5. Limitations and contrary evidence',
      purpose: 'Address the spatial-frequency cutoff discrepancy and overcompleteness scaling.',
      prose: `While sparse coding accounts for orientation selectivity, the learned spatial-frequency distribution remains narrower than physiological recordings in primate cortex. Specifically, basis filters fail to match the high-frequency cutoff observed in foveal simple cells (3.40 cpd model vs 5.80 cpd biological).

Additionally, overcomplete dictionaries introduce reconstruction stability trade-offs that standard linear decoding fails to resolve without recurrent inhibition.`,
      placedReferences: [
        {
          id: 'ref-c1-sec5',
          targetType: 'claim',
          targetId: 'c1',
          placedVersion: 3,
          anchorCode: 'C1',
          placedTimestamp: Date.now() - 1000 * 60 * 60 * 4,
        },
      ],
      placedArtifacts: [],
    },
    {
      id: 'sec-6',
      title: '6. Discussion',
      purpose: '', // Intentionally unwritten to demonstrate 'Purpose unwritten' gap!
      prose: `The correspondence between sparse coding basis functions and cortical receptive fields suggests that sensory representations are adapted to natural scene statistics. Future investigations must address non-classical receptive field modulations and recurrent lateral connectivity.`,
      placedReferences: [],
      placedArtifacts: [],
    },
  ],
};
