import { OpenProblemNote, CandidateQuestion } from '../types';

export const INITIAL_OPEN_PROBLEMS: OpenProblemNote[] = [
  {
    id: 'op-1',
    text: 'On-device INT4 quantization degrades attention map sparsity unpredictably across transformer layers.',
    citation: 'Lin et al. 2023, MLSys',
    createdAt: Date.now() - 600000,
  },
  {
    id: 'op-2',
    text: 'Microcontroller SRAM limits force activation swapping that dominates compute latency by up to 8x.',
    citation: 'Zhang & Banerjee 2024, TinyML Summit',
    createdAt: Date.now() - 500000,
  },
  {
    id: 'op-3',
    text: 'Hardware cycle timers lack standardized baseline clocks across Cortex-M4 and ESP32 benchmarks.',
    citation: 'Banbury et al. 2021, IEEE Micro',
    createdAt: Date.now() - 400000,
  },
  {
    id: 'op-4',
    text: 'Non-volatile FeRAM write endurance limits on-chip continual weight updates to under 10k steps.',
    citation: 'Venkatesan et al. 2022, Nature Electronics',
    createdAt: Date.now() - 300000,
  },
  {
    id: 'op-5',
    text: 'Dynamic voltage-frequency scaling during inference induces non-deterministic timing jitter in micro-wakeups.',
    citation: 'Choi et al. 2023, ISLPED',
    createdAt: Date.now() - 200000,
  },
  {
    id: 'op-6',
    text: 'Direct memory access channel collisions corrupt sparse weight pre-fetches during asynchronous tensor ops.',
    citation: 'Alvarez & Kumar 2024, Embedded Systems Letters',
    createdAt: Date.now() - 100000,
  },
];

export const INITIAL_CANDIDATE_QUESTIONS: CandidateQuestion[] = [
  {
    id: 'cq-1',
    text: 'Are TinyML latency numbers comparable across devices?',
    openProblemIds: ['op-1', 'op-2', 'op-3'],
    createdAt: Date.now() - 350000,
  },
];
