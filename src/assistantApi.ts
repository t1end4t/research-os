import type { AssistantContextInfo } from './types';

export interface AssistantRequest {
  threadId: string;
  context: AssistantContextInfo;
  message: string;
  quotedSnippet?: string;
  contextData: unknown;
}

export interface AssistantResponse {
  text: string;
  modelId: string;
}

export interface AssistantErrorResponse {
  error: string;
}
