import type { AppConfig } from '../config.ts';
import { invalidRequestError, unsupportedCapabilityError } from '../errors.ts';
import { normalizeMessages } from '../normalize/messages.ts';
import { normalizeTools } from '../normalize/tools.ts';
import { normalizeOpenAIResponseFormat } from '../openai/response-format.ts';
import { samplingDefaultsFor } from '../profile.ts';
import { applySamplingDefaults } from './sampling.ts';
import type { CanonicalChatRequest } from './canonical.ts';

type JsonObject = Record<string, any>;

export function responsesRequestToCanonical(input: JsonObject, config: AppConfig, previousMessages: JsonObject[] = []): CanonicalChatRequest {
  const messages: JsonObject[] = [];
  if (typeof input.instructions === 'string' && input.instructions.length > 0) {
    messages.push({ role: 'system', content: input.instructions });
  }
  if (previousMessages.length > 0) {
    const skipPreviousSystem = messages.some((message) => message.role === 'system');
    messages.push(...previousMessages.filter((message) => !(skipPreviousSystem && message.role === 'system')));
  }
  messages.push(...responseInputToChatMessages(input.input, config));

  const chat: JsonObject = { ...input, messages };
  if (input.max_output_tokens !== undefined) chat.max_tokens = input.max_output_tokens;
  delete chat.instructions;
  delete chat.input;
  delete chat.max_output_tokens;
  rejectHostedResponsesTools(chat.tools);
  applySamplingDefaults(chat, samplingDefaultsFor(config));
  normalizeTools(chat);
  normalizeOpenAIResponseFormat(chat, config);

  const {
    model,
    messages: normalized,
    tools,
    tool_choice,
    response_format,
    max_tokens,
    stream,
    store,
    metadata,
    temperature,
    top_p,
    frequency_penalty,
    presence_penalty,
    seed,
    n,
    top_k,
    ...extras
  } = chat;

  return {
    source: 'openai_responses',
    model,
    messages: normalized,
    tools,
    tool_choice,
    response_format,
    sampling: { temperature, top_p, frequency_penalty, presence_penalty, seed, n, top_k },
    max_tokens,
    stream,
    store,
    metadata,
    extras,
  };
}

export function responseInputToChatMessages(input: unknown, config: AppConfig): JsonObject[] {
  if (typeof input === 'string') return [{ role: 'user', content: input }];
  if (Array.isArray(input)) return normalizeResponseItems(input, config);
  throw invalidRequestError('input must be a string or message array');
}

export function responseOutputToChatMessages(output: unknown, config: AppConfig): JsonObject[] {
  if (!Array.isArray(output)) return [];
  return normalizeResponseItems(output, config);
}

function normalizeResponseItems(items: unknown[], config: AppConfig): JsonObject[] {
  const messages: unknown[] = [];
  let pendingToolCalls: JsonObject[] = [];
  const flushPendingToolCalls = () => {
    if (pendingToolCalls.length === 0) return;
    messages.push({ role: 'assistant', content: null, tool_calls: pendingToolCalls });
    pendingToolCalls = [];
  };

  for (const item of items) {
    if (!isObject(item)) {
      flushPendingToolCalls();
      messages.push(item);
      continue;
    }

    if (item.type === 'reasoning') continue;

    if (item.type === 'function_call') {
      pendingToolCalls.push(responseFunctionCallToChatToolCall(item));
      continue;
    }

    flushPendingToolCalls();

    if (item.type === 'function_call_output') {
      if (typeof item.call_id !== 'string' || item.call_id.length === 0) {
        throw invalidRequestError('function_call_output item is missing call_id');
      }
      messages.push({
        role: 'tool',
        tool_call_id: item.call_id,
        content: normalizeFunctionCallOutput(item.output),
      });
      continue;
    }

    messages.push(normalizeResponseInputMessage(item));
  }

  flushPendingToolCalls();
  return normalizeMessages(messages, config);
}

function responseFunctionCallToChatToolCall(item: JsonObject): JsonObject {
  if (typeof item.name !== 'string' || item.name.length === 0) {
    throw invalidRequestError('function_call item is missing name');
  }
  const callId = typeof item.call_id === 'string' && item.call_id.length > 0
    ? item.call_id
    : (typeof item.id === 'string' && item.id.length > 0 ? item.id : `call_${crypto.randomUUID()}`);
  return {
    id: callId,
    type: 'function',
    function: {
      name: item.name,
      arguments: normalizeFunctionArguments(item.arguments),
    },
  };
}

function normalizeFunctionArguments(value: unknown): string {
  if (value === undefined || value === null || value === '') return '{}';
  if (typeof value === 'string') return value;
  if (isObject(value)) return JSON.stringify(value);
  return '{}';
}

function normalizeFunctionCallOutput(output: unknown): string {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) {
    const parts: string[] = [];
    for (const part of output) {
      if (!isObject(part)) continue;
      if (typeof part.text === 'string' && (part.type === 'input_text' || part.type === 'output_text' || part.type === 'text')) {
        parts.push(part.text);
      } else if (part.type === 'input_image' || part.type === 'image_url') {
        parts.push('[image]');
      }
    }
    return parts.join('\n');
  }
  if (output === undefined || output === null) return '';
  try {
    return JSON.stringify(output);
  } catch {
    return String(output);
  }
}

function normalizeResponseInputMessage(message: unknown): unknown {
  if (!isObject(message) || !Array.isArray(message.content)) return message;
  return {
    ...message,
    content: message.content.map((part) => {
      if (!isObject(part) || typeof part.type !== 'string') return part;
      if ((part.type === 'input_text' || part.type === 'output_text') && typeof part.text === 'string') {
        return { type: 'text', text: part.text };
      }
      if (part.type === 'input_image' && typeof part.image_url === 'string') {
        return { type: 'image_url', image_url: { url: part.image_url } };
      }
      return part;
    }),
  };
}
function rejectHostedResponsesTools(tools: unknown): void {
  if (!Array.isArray(tools)) return;
  for (const tool of tools) {
    if (isObject(tool) && typeof tool.type === 'string' && tool.type !== 'function') {
      throw unsupportedCapabilityError(`${tool.type} tools are not supported by this local llama.cpp backend`);
    }
  }
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
