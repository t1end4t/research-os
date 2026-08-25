import { QuestionNode } from '../types';

export const INITIAL_QUESTIONS_DATA: QuestionNode[] = [
  {
    id: 'q1',
    type: 'QUESTION',
    text: 'Does sparse coding reduce interference?',
    tags: ['tinyml', 'memory'],
    claims: [
      {
        id: 'c1',
        type: 'CLAIM',
        text: 'Sparsity lowers overlap, and overlap causes interference.',
        linkStatus: 'weak',
        evidence: [
          {
            id: 'e1',
            kind: 'paper',
            typeLabel: 'PAPER',
            title: 'Sparse codes emerge from image statistics',
            citation: 'Olshausen & Field 1996',
          },
          {
            id: 'e2',
            kind: 'paper',
            typeLabel: 'PAPER',
            title: 'Overlap correlates with recall error',
            citation: 'Ahmad & Scheinkman 2019',
          },
          {
            id: 'e3',
            kind: 'experiment',
            typeLabel: 'EXPERIMENT',
            title: '',
            placeholderText: 'planned: subspace overlap manipulation',
            status: 'planned',
            isEmpty: true,
          },
        ],
        check: {
          tag: 'TYPE MISMATCH',
          tagColor: 'amber',
          reasonText:
            'Sparsity geometrically forces representations into orthogonal subspaces, which prevents weight corruption during sequential learning.',
          explanation:
            'Your claim is causal. Both findings are correlational - neither manipulates overlap while holding sparsity fixed.',
          checks: [
            {
              label: 'Type',
              status: 'mismatch',
              detail: 'Causal claim backed only by observational correlations',
            },
            {
              label: 'Scope',
              status: 'partial',
              detail: 'Vision encoding to associative recall tasks',
            },
            {
              label: 'Target',
              status: 'aligned',
              detail: 'Interference reduction via orthogonal activation',
            },
          ],
        },
      },
      {
        id: 'c2',
        type: 'CLAIM',
        text: 'Hippocampal codes are sparse for this reason.',
        linkStatus: 'missing',
        evidence: [],
        check: {
          tag: 'NO EVIDENCE LINKED',
          tagColor: 'red',
          reasonText:
            'Dentate gyrus granule cells maintain low firing probability (~2-5%) to prevent memory interference.',
          explanation:
            'This claim is an untested teleological assertion. No empirical papers or experimental manipulations are currently attached to this node.',
          checks: [
            {
              label: 'Type',
              status: 'missing',
              detail: 'Hypothesis without supporting citations or tests',
            },
            {
              label: 'Scope',
              status: 'unverified',
              detail: 'Dentate gyrus pattern separation circuits',
            },
            {
              label: 'Target',
              status: 'unverified',
              detail: 'Episodic memory interference prevention',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'q2',
    type: 'QUESTION',
    text: 'Is dictionary learning the same claim in NLP?',
    tags: ['memory'],
    claims: [
      {
        id: 'c3',
        type: 'CLAIM',
        text: 'Dictionary size controls feature superposition.',
        linkStatus: 'holds',
        evidence: [
          {
            id: 'e4',
            kind: 'paper',
            typeLabel: 'PAPER',
            title: 'Toy models of superposition',
            citation: 'Elhage et al. 2022',
          },
          {
            id: 'e5',
            kind: 'paper',
            typeLabel: 'PAPER',
            title: 'Towards Monosemanticity: Decomposing Language Models',
            citation: 'Bricken et al. 2023',
          },
          {
            id: 'e6',
            kind: 'paper',
            typeLabel: 'PAPER',
            title: 'Scaling and evaluating sparse autoencoders',
            citation: 'Gao et al. 2024',
          },
        ],
        check: {
          tag: 'EMPIRICAL SUPPORT CONFIRMED',
          tagColor: 'emerald',
          reasonText:
            'Overcomplete sparse autoencoders disentangle polysemantic activations into monosemantic feature directions.',
          explanation:
            'All three foundational papers demonstrate that scaling the dictionary capacity directly mitigates superposition interference in transformer language models.',
          checks: [
            {
              label: 'Type',
              status: 'aligned',
              detail: 'Mechanistic and empirical proofs with dictionary interventions',
            },
            {
              label: 'Scope',
              status: 'aligned',
              detail: 'Transformer residual streams and MLP layers',
            },
            {
              label: 'Target',
              status: 'aligned',
              detail: 'Direct control over linear feature superposition',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'q3',
    type: 'QUESTION',
    text: 'Which readout model fits the CA3 data?',
    tags: ['tinyml'],
    claims: [],
  },
];

export const INITIAL_GRAPH_DATA = INITIAL_QUESTIONS_DATA[0];
