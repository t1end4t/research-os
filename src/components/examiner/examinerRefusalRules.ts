import { ExaminerRefusalData } from './types';

interface RefusalRule {
  pattern: RegExp;
  declinedWhat: string;
  declinedReason: string;
}

const REFUSAL_RULES: RefusalRule[] = [
  {
    pattern: /(write|draft|generate|suggest|improve|complete|fill|author).*(user_reason|reason|why this supports|support reason|link reason)/i,
    declinedWhat: 'Writing user reason',
    declinedReason:
      "I don't write reasons. The check only means something because you committed the reason first.",
  },
  {
    pattern: /(promote.*candidate|write.*promote.*claim|tick.*promote|falsification.*condition|settled.*within.*year)/i,
    declinedWhat: 'Promoting survey candidate',
    declinedReason:
      "I don't draft candidate promotion claims or confirm falsification criteria. The promotion gate exists so you commit to an empirical test before it enters the graph.",
  },
  {
    pattern: /(summarize|give.*summary|tldr|overview.*of.*paper|summarise|briefly.*explain.*paper)/i,
    declinedWhat: 'Summarizing paper',
    declinedReason:
      "I don't summarize papers. Summarizing replaces the reading that produces understanding.",
  },
  {
    pattern: /(invent|fabricate|make up|hallucinate|generate).*(claim|paper|finding|artifact|experiment)/i,
    declinedWhat: 'Fabricating research items',
    declinedReason:
      "I don't fabricate claims, findings, or artifacts. All nodes in the tree must originate from your own findings or stated sources.",
  },
  {
    pattern: /(interesting.*(research.*)?question|generate.*question|suggest.*topic.*question|give.*me.*topics)/i,
    declinedWhat: 'Generating research questions from topic',
    declinedReason:
      "I don't generate research questions from a topic prompt. Questions must come from structure — an unsupported claim, an unresolved mismatch, or a cluster of open problems.",
  },
  {
    pattern: /(set.*status.*holds|change.*link.*status|evaluate.*link.*without.*reason|check.*link.*anyway)/i,
    declinedWhat: 'Evaluating link without user reason',
    declinedReason:
      "A link cannot be checked or have its status set without a user-written reason. Commit your reason on the link first.",
  },
  {
    pattern: /(write|draft|fill).*(what did this show|artifact observation|observation)/i,
    declinedWhat: 'Writing artifact observation',
    declinedReason:
      "I don't write artifact observations. You must state what the measurement established before linking it into the argument.",
  },
  {
    pattern: /(write|draft).*(what can be concluded|standing note|synthesis)/i,
    declinedWhat: 'Writing standing conclusion note',
    declinedReason:
      "I don't write synthesis notes. Stating what can be concluded is the core responsibility of the researcher.",
  },
  {
    pattern: /(write|draft|generate).*(draft|section|prose|caption|transition|conclusion|paragraph)/i,
    declinedWhat: 'Writing draft text or captions',
    declinedReason:
      "I don't write draft prose, section purposes, captions, or conclusions. The draft assembly is your argument in your words.",
  },
  {
    pattern: /(ready to write up|ready to publish|should I write up|is my argument ready)/i,
    declinedWhat: 'Evaluating publication readiness',
    declinedReason:
      "I don't evaluate readiness to publish. The argument map displays the weaknesses and gaps so you can judge readiness yourself.",
  },
];

/**
 * Checks if a user's text message matches a strict product boundary refusal rule.
 * Returns the specific refusal data or null if permitted.
 */
export function checkRefusal(message: string): ExaminerRefusalData | null {
  const normalized = message.trim();
  for (const rule of REFUSAL_RULES) {
    if (rule.pattern.test(normalized)) {
      return {
        declinedWhat: rule.declinedWhat,
        declinedReason: rule.declinedReason,
        modelId: 'cx/gpt-5.6-sol',
      };
    }
  }
  return null;
}
