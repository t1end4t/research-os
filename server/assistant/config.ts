export const ASSISTANT_MODEL_ID = 'cx/gpt-5.6-sol';
export const ASSISTANT_PROVIDER_ID = '9router';
export const DEFAULT_NINEROUTER_BASE_URL = 'http://127.0.0.1:20128/v1';
export const MAX_AGENT_TURNS = 4;
export const MAX_CONTEXT_BYTES = 256_000;

export function getNineRouterBaseUrl() {
  return process.env.NINEROUTER_BASE_URL || DEFAULT_NINEROUTER_BASE_URL;
}
