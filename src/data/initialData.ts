import { QuestionNode } from '../types';

export const INITIAL_QUESTIONS_DATA: QuestionNode[] = [
  {
    id: 'q1',
    type: 'QUESTION',
    text: 'How does V1 encode natural scenes?',
    tags: ['tinyml', 'vision', 'memory'],
    claims: [
      {
        id: 'c1',
        type: 'CLAIM',
        text: 'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
        version: 3,
        lastEditedTime: 'edited 2 days ago',
        linkStatus: 'weak',
        questionReason:
          'The receptive-field properties this claim explains are the ones the question asks about, and no competing account predicts them from image statistics alone.',
        questionCheckResult: {
          modelId: 'cx/gpt-5.6-sol',
          timestamp: 'checked 2 days ago',
          finding:
            'Claim directly addresses simple-cell receptive field properties from natural scene statistics.',
          axes: [
            {
              label: 'TYPE',
              verdict: 'pass',
              detail: 'claim and question both address encoding mechanisms',
            },
            {
              label: 'SCOPE',
              verdict: 'pass',
              detail: 'both concern simple cells in primary visual cortex',
            },
            {
              label: 'TARGET',
              verdict: 'pass',
              detail: 'explains receptive-field properties asked by question',
            },
          ],
        },
        evidence: [
          {
            id: 'e1',
            kind: 'paper',
            typeLabel: 'PAPER FINDING',
            title: 'Sparse codes emerge from natural image statistics.',
            citation: 'Olshausen & Field 1996',
            paperId: 'p1',
            linkStatus: 'holds',
            userReason:
              'The model was fit on natural images and recovered oriented, localized, bandpass filters without being told to.',
            checkResult: {
              modelId: 'cx/gpt-5.6-sol',
              timestamp: 'checked 2 days ago',
              finding:
                'The model was fit on natural images and recovered oriented, localized, bandpass filters without supervisory tuning.',
              axes: [
                {
                  label: 'TYPE',
                  verdict: 'pass',
                  detail: 'claim and finding are both mechanistic',
                },
                {
                  label: 'SCOPE',
                  verdict: 'pass',
                  detail: 'both concern simple cells in V1',
                },
                {
                  label: 'TARGET',
                  verdict: 'pass',
                  detail: 'the finding measures what the claim asserts',
                },
              ],
            },
          },
          {
            id: 'e2',
            kind: 'paper',
            typeLabel: 'PAPER FINDING',
            title: 'Overcomplete dictionaries better match V1 responses.',
            citation: 'Rehn & Sommer 2007',
            paperId: 'p2',
            linkStatus: 'weak',
            userReason: '', // Empty reason -> Visible hole & disabled check control
          },
          {
            id: 'e3',
            kind: 'experiment',
            typeLabel: 'EXPERIMENT FINDING',
            title: 'Dictionary size sweep on natural image patches.',
            citation: 'running · 2 artifacts',
            status: 'running',
            artifactCount: 2,
            linkStatus: 'missing',
            userReason:
              'Larger dictionaries should improve the fit if overcompleteness is doing the work here.',
            checkResult: {
              modelId: 'cx/gpt-5.6-sol',
              timestamp: 'checked 6 hours ago',
              finding:
                'Target mismatch: reconstruction loss does not measure receptive-field tuning geometry.',
              axes: [
                {
                  label: 'TYPE',
                  verdict: 'pass',
                  detail: 'both are causal',
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
          },
        ],
        check: {
          tag: 'TARGET MISMATCH IN EXPERIMENT',
          tagColor: 'amber',
          reasonText:
            'The receptive-field properties this claim explains are the ones the question asks about, and no competing account predicts them from image statistics alone.',
          explanation:
            'Support includes one holding paper finding, one finding missing user reason, and one experimental sweep with target mismatch.',
          checks: [
            {
              label: 'Type',
              status: 'aligned',
              detail: 'Mechanistic and empirical causal models',
            },
            {
              label: 'Scope',
              status: 'partial',
              detail: 'Simple cells in primary visual cortex',
            },
            {
              label: 'Target',
              status: 'mismatch',
              detail: 'Reconstruction error vs receptive-field shape',
            },
          ],
        },
        history: [
          {
            versionNumber: 3,
            versionLabel: 'v3',
            timestamp: 'now',
            createdAt: Date.now() - 1000 * 60 * 60 * 2,
            claimText:
              'Sparse coding explains simple-cell receptive fields in primary visual cortex.',
            note: 'Narrowed to simple cells after a scope mismatch.',
            trigger: 'Scope mismatch',
          },
          {
            versionNumber: 2,
            versionLabel: 'v2',
            timestamp: '6 Mar',
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
            claimText:
              'Sparse coding explains receptive fields in primary visual cortex.',
            note: 'Added "in primary visual cortex" to bound the claim.',
            trigger: 'Context bound',
          },
          {
            versionNumber: 1,
            versionLabel: 'v1',
            timestamp: '2 Mar',
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
            claimText:
              'Sparse coding explains receptive fields in visual cortex.',
            note: 'Initial formulation of hypothesis.',
            trigger: 'Initial',
          },
        ],
        linkEvents: [
          {
            id: 'evt-1',
            timestamp: 'now',
            createdAt: Date.now() - 1000,
            kind: 'version_created',
            summary:
              'Version v3 committed: Narrowed to simple cells after a scope mismatch.',
            userNote:
              'Scope mismatch on complex cells resolved by bounding claim to simple cells.',
          },
          {
            id: 'evt-2',
            timestamp: '6 hours ago',
            createdAt: Date.now() - 21600000,
            kind: 'check_run',
            summary:
              'Check run on Dictionary size sweep finding (TARGET mismatch: measures reconstruction error).',
          },
          {
            id: 'evt-3',
            timestamp: '2 days ago',
            createdAt: Date.now() - 172800000,
            kind: 'check_run',
            summary:
              'Check run on Sparse codes emerge finding (All 3 axes PASS).',
          },
          {
            id: 'evt-4',
            timestamp: '6 Mar',
            createdAt: Date.now() - 345600000,
            kind: 'version_created',
            summary:
              'Version v2 committed: Added "in primary visual cortex" to bound the claim.',
            userNote: 'Added primary cortex spatial boundary.',
          },
        ],
      },
      {
        id: 'c2',
        type: 'CLAIM',
        text: 'Hippocampal codes are sparse for this reason.',
        version: 1,
        lastEditedTime: 'edited 4 days ago',
        linkStatus: 'missing',
        isRejected: true,
        rejectNote:
          'Lack of causal isolation between dentate gyrus firing rates and behavioral pattern separation.',
        questionReason:
          'Dentate gyrus granule cells maintain low firing probability (~2-5%) to prevent memory interference.',
        evidence: [], // 0 findings -> Ghost Card!
        check: {
          tag: 'REJECTED · NO EVIDENCE',
          tagColor: 'red',
          reasonText:
            'Dentate gyrus granule cells maintain low firing probability (~2-5%) to prevent memory interference.',
          explanation:
            'This claim is currently flagged as rejected. No empirical findings or experiments are attached.',
          checks: [
            {
              label: 'Type',
              status: 'missing',
              detail: 'Untested teleological hypothesis',
            },
            {
              label: 'Scope',
              status: 'unverified',
              detail: 'Dentate gyrus pattern separation',
            },
            {
              label: 'Target',
              status: 'unverified',
              detail: 'Episodic memory interference prevention',
            },
          ],
        },
        history: [
          {
            versionNumber: 1,
            versionLabel: 'v1',
            timestamp: '4 days ago',
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
            claimText: 'Hippocampal codes are sparse for this reason.',
            note: 'Initial hypothesis on hippocampal granule sparsity.',
            trigger: 'Initial',
          },
        ],
        linkEvents: [
          {
            id: 'evt-c2-1',
            timestamp: '3 days ago',
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
            kind: 'claim_rejected',
            summary: 'Claim marked as rejected: Lack of causal isolation.',
            userNote:
              'Lack of causal isolation between dentate gyrus firing rates and behavioral pattern separation.',
          },
        ],
      },
    ],
  },
  {
    id: 'q2',
    type: 'QUESTION',
    text: 'Is dictionary learning the same claim in NLP?',
    tags: ['memory', 'nlp'],
    claims: [
      {
        id: 'c3',
        type: 'CLAIM',
        text: 'Dictionary size controls feature superposition.',
        version: 2,
        lastEditedTime: 'edited 3 days ago',
        linkStatus: 'holds',
        questionReason:
          'Overcomplete sparse autoencoders disentangle polysemantic activations into monosemantic feature directions.',
        questionCheckResult: {
          modelId: 'cx/gpt-5.6-sol',
          timestamp: 'checked 3 days ago',
          finding:
            'Mechanistic intervention links dictionary capacity with linear feature superposition in language models.',
          axes: [
            {
              label: 'TYPE',
              verdict: 'pass',
              detail: 'both are mechanistic interventions',
            },
            {
              label: 'SCOPE',
              verdict: 'pass',
              detail: 'transformer residual streams and MLP representations',
            },
            {
              label: 'TARGET',
              verdict: 'pass',
              detail: 'directly measures linear superposition decay',
            },
          ],
        },
        evidence: [
          {
            id: 'e4',
            kind: 'paper',
            typeLabel: 'PAPER FINDING',
            title: 'Toy models of superposition',
            citation: 'Elhage et al. 2022',
            paperId: 'p3',
            linkStatus: 'holds',
            userReason:
              'Mathematical analysis shows overcompleteness allows features to be stored non-orthogonally when activations are sparse.',
            checkResult: {
              modelId: 'cx/gpt-5.6-sol',
              timestamp: 'checked 3 days ago',
              finding:
                'Formal geometric proof for dictionary capacity scaling under sparsity.',
              axes: [
                {
                  label: 'TYPE',
                  verdict: 'pass',
                  detail: 'analytical and empirical toy models match claim',
                },
                {
                  label: 'SCOPE',
                  verdict: 'pass',
                  detail: 'low-dimensional synthetic network activations',
                },
                {
                  label: 'TARGET',
                  verdict: 'pass',
                  detail: 'measures linear interference under capacity limits',
                },
              ],
            },
          },
          {
            id: 'e5',
            kind: 'paper',
            typeLabel: 'PAPER FINDING',
            title: 'Towards Monosemanticity: Decomposing Language Models',
            citation: 'Bricken et al. 2023',
            paperId: 'p4',
            linkStatus: 'holds',
            userReason:
              'Sparse autoencoders successfully extracted interpretable monosemantic features from a 1-layer transformer.',
            checkResult: {
              modelId: 'cx/gpt-5.6-sol',
              timestamp: 'checked 3 days ago',
              finding:
                'Empirical demonstration of dictionary scaling resolving polysemanticity in MLP layers.',
              axes: [
                {
                  label: 'TYPE',
                  verdict: 'pass',
                  detail: 'empirical intervention on transformer weights',
                },
                {
                  label: 'SCOPE',
                  verdict: 'pass',
                  detail: '1-layer model MLP representations',
                },
                {
                  label: 'TARGET',
                  verdict: 'pass',
                  detail: 'feature interpretability and activation isolation',
                },
              ],
            },
          },
          {
            id: 'e6',
            kind: 'paper',
            typeLabel: 'PAPER FINDING',
            title: 'Scaling and evaluating sparse autoencoders',
            citation: 'Gao et al. 2024',
            paperId: 'p5',
            linkStatus: 'holds',
            userReason:
              'Evaluated SAEs up to 16M features on frontier models and proved scaling law between dictionary width and reconstruction fidelity.',
            checkResult: {
              modelId: 'cx/gpt-5.6-sol',
              timestamp: 'checked 2 days ago',
              finding:
                'Frontier scaling evaluation confirming dictionary expansion reduces interference.',
              axes: [
                {
                  label: 'TYPE',
                  verdict: 'pass',
                  detail: 'large-scale causal intervention',
                },
                {
                  label: 'SCOPE',
                  verdict: 'pass',
                  detail: 'state-of-the-art multi-layer LLMs',
                },
                {
                  label: 'TARGET',
                  verdict: 'pass',
                  detail: 'downstream task degradation and feature recovery',
                },
              ],
            },
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
        history: [
          {
            versionNumber: 2,
            versionLabel: 'v2',
            timestamp: '3 days ago',
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
            claimText: 'Dictionary size controls feature superposition.',
            note: 'Updated to focus on dictionary capacity control.',
            trigger: 'Superposition study',
          },
          {
            versionNumber: 1,
            versionLabel: 'v1',
            timestamp: '10 days ago',
            createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
            claimText: 'SAEs eliminate polysemanticity in LLMs.',
            note: 'Initial phrasing.',
            trigger: 'Initial',
          },
        ],
      },
    ],
  },
  {
    id: 'q3',
    type: 'QUESTION',
    text: 'Which readout model fits the CA3 data?',
    tags: ['tinyml', 'memory'],
    claims: [],
  },
];

export const INITIAL_GRAPH_DATA = INITIAL_QUESTIONS_DATA[0];
