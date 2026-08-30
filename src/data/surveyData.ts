import { OpenProblemNote, CandidateQuestion } from '../types';

export const INITIAL_OPEN_PROBLEMS: OpenProblemNote[] = [
  {
    id: 'op-1',
    text: 'On-device INT4 quantization degrades attention map sparsity unpredictably across transformer layers.',
    citation: 'Lin et al. 2023, MLSys',
    createdAt: 1700000000000,
  },
  {
    id: 'op-2',
    text: 'Microcontroller SRAM limits force activation swapping that dominates compute latency by up to 8x.',
    citation: 'Zhang & Banerjee 2024, TinyML Summit',
    createdAt: 1700000010000,
  },
  {
    id: 'op-3',
    text: 'Hardware cycle timers lack standardized baseline clocks across Cortex-M4 and ESP32 benchmarks.',
    citation: 'Banbury et al. 2021, IEEE Micro',
    createdAt: 1700000020000,
  },
  {
    id: 'op-4',
    text: 'Non-volatile FeRAM write endurance limits on-chip continual weight updates to under 10k steps.',
    citation: 'Venkatesan et al. 2022, Nature Electronics',
    createdAt: 1700000030000,
  },
  {
    id: 'op-5',
    text: 'Dynamic voltage-frequency scaling during inference induces non-deterministic timing jitter in micro-wakeups.',
    citation: 'Choi et al. 2023, ISLPED',
    createdAt: 1700000040000,
  },
  {
    id: 'op-6',
    text: 'Direct memory access channel collisions corrupt sparse weight pre-fetches during asynchronous tensor ops.',
    citation: 'Alvarez & Kumar 2024, Embedded Systems Letters',
    createdAt: 1700000050000,
  },
  {
    id: 'op-7',
    text: 'Weight pruning masks derived from static saliency metrics fail to predict runtime throughput on systolic arrays with structured sparsity constraints.',
    citation: 'Mishra et al. 2023, ISCA',
    createdAt: 1700000060000,
  },
  {
    id: 'op-8',
    text: 'Thermal throttling on enclosed sensor nodes causes non-linear clock drift during continuous acoustic keyword spotting runs.',
    citation: 'Gallego & Chen 2023, ACM SenSys',
    createdAt: 1700000070000,
  },
  {
    id: 'op-9',
    text: 'Mixed-precision activation schedules cause unexpected register spilling when compiling for constrained RV32IMAF vector extensions.',
    citation: 'Narayanan et al. 2024, ASPLOS',
    createdAt: 1700000080000,
  },
  {
    id: 'op-10',
    text: 'Energy harvesters introduce brownout voltage sags that reset volatile accumulator registers mid-layer computation.',
    citation: 'Saha et al. 2022, IEEE TVLSI',
    createdAt: 1700000090000,
  },
  {
    id: 'op-11',
    text: 'Quantized activation outlier suppression algorithms increase static SRAM overhead beyond the savings achieved by 4-bit weight compression.',
    citation: 'Dettmers & Zettlemoyer 2023, NeurIPS',
    createdAt: 1700000100000,
  },
  {
    id: 'op-12',
    text: 'Compiler layer-fusion heuristics produce degenerate memory access patterns on shared L1 cache scratchpads under concurrent sensor DMA transfers.',
    citation: 'Keller et al. 2024, MICRO',
    createdAt: 1700000110000,
  },
];

export const INITIAL_CANDIDATE_QUESTIONS: CandidateQuestion[] = [
  {
    id: 'cq-1',
    text: 'Are TinyML latency numbers comparable across devices?',
    openProblemIds: ['op-2', 'op-3', 'op-5'],
    createdAt: 1700000250000,
  },
  {
    id: 'cq-2',
    text: 'Does runtime memory contention dominate compute speedup in sub-milliwatt accelerators?',
    openProblemIds: ['op-5', 'op-6', 'op-9', 'op-12'],
    createdAt: 1700000300000,
  },
  {
    id: 'cq-3',
    text: 'Can non-volatile on-chip storage support continual learning without destructive wear?',
    openProblemIds: ['op-4', 'op-6', 'op-10'],
    createdAt: 1700000350000,
  },
];
