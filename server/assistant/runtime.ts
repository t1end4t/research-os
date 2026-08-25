import { Agent, type AgentTool } from '@earendil-works/pi-agent-core';
import { createModels, createProvider, type Model } from '@earendil-works/pi-ai';
import { openAIResponsesApi } from '@earendil-works/pi-ai/api/openai-responses.lazy';
import type { Static } from 'typebox';
import type { AssistantRequest, AssistantResponse } from '../../src/assistantApi';
import {
  ASSISTANT_MODEL_ID,
  ASSISTANT_PROVIDER_ID,
  getNineRouterBaseUrl,
  MAX_AGENT_TURNS,
  MAX_CONTEXT_BYTES,
} from './config';
import { ASSISTANT_SYSTEM_PROMPT } from './prompt';
import { ReplyParameters } from './schemas';

interface ActiveRun {
  text?: string;
  turns: number;
}

interface ThreadRuntime {
  agent: Agent;
  run?: ActiveRun;
}

const model: Model<'openai-responses'> = {
  id: ASSISTANT_MODEL_ID,
  name: ASSISTANT_MODEL_ID,
  api: 'openai-responses',
  provider: ASSISTANT_PROVIDER_ID,
  baseUrl: getNineRouterBaseUrl(),
  reasoning: true,
  input: ['text'],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 200_000,
  maxTokens: 4_096,
  compat: { supportsDeveloperRole: true, supportsStrictMode: true },
};

const provider = createProvider({
  id: ASSISTANT_PROVIDER_ID,
  name: '9router',
  baseUrl: model.baseUrl,
  auth: {
    apiKey: {
      name: '9router',
      resolve: async () => ({
        auth: { apiKey: process.env.NINEROUTER_API_KEY || '9router-local' },
      }),
    },
  },
  models: [model],
  api: openAIResponsesApi(),
});

const models = createModels();
models.setProvider(provider);

const threads = new Map<string, ThreadRuntime>();

function createThread(threadId: string) {
  const runtime = {} as ThreadRuntime;
  const reply: AgentTool<typeof ReplyParameters, { disposition: string }> = {
    name: 'reply',
    label: 'Reply',
    description: 'Return the assistant transcript response.',
    parameters: ReplyParameters,
    constrainedSampling: { type: 'json_schema', strict: 'require' },
    executionMode: 'sequential',
    execute: async (_toolCallId, params: Static<typeof ReplyParameters>) => {
      if (!runtime.run) throw new Error('No active assistant request.');
      if (runtime.run.text) throw new Error('Only one reply is allowed.');
      runtime.run.text = params.text;
      return {
        content: [{ type: 'text', text: 'Reply accepted.' }],
        details: { disposition: params.disposition },
        terminate: true,
      };
    },
  };

  runtime.agent = new Agent({
    initialState: {
      systemPrompt: ASSISTANT_SYSTEM_PROMPT,
      model,
      thinkingLevel: 'medium',
      tools: [reply],
      messages: [],
    },
    streamFn: models.streamSimple.bind(models),
    sessionId: threadId,
    toolExecution: 'sequential',
    maxRetryDelayMs: 2_000,
    shouldStopAfterTurn: async () => {
      if (!runtime.run) return true;
      runtime.run.turns += 1;
      return runtime.run.turns >= MAX_AGENT_TURNS;
    },
  });

  threads.set(threadId, runtime);
  return runtime;
}

export async function runAssistant(request: AssistantRequest): Promise<AssistantResponse> {
  const prompt = JSON.stringify({
    request: request.message,
    quotedSnippet: request.quotedSnippet,
    activeContext: request.context,
    contextData: request.contextData,
  });
  if (Buffer.byteLength(prompt, 'utf8') > MAX_CONTEXT_BYTES) {
    throw new Error('Assistant context exceeds the 256 KB limit.');
  }

  const runtime = threads.get(request.threadId) || createThread(request.threadId);
  if (runtime.agent.state.isStreaming) {
    throw new Error('This assistant thread is already processing a message.');
  }

  runtime.run = { turns: 0 };
  try {
    await runtime.agent.prompt(prompt);
    if (!runtime.run.text) {
      await runtime.agent.prompt('Call the reply tool exactly once now.');
    }
    if (!runtime.run.text) {
      throw new Error(runtime.agent.state.errorMessage || 'The assistant produced no valid reply.');
    }
    return { text: runtime.run.text, modelId: ASSISTANT_MODEL_ID };
  } finally {
    runtime.run = undefined;
  }
}
