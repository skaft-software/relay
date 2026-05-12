import { GatewayError, upstreamError } from '../errors.ts';

type JsonObject = Record<string, any>;

export function normalizeTools(body: JsonObject): void {
  if (!body.tools && Array.isArray(body.functions)) {
    body.tools = body.functions.map((fn: unknown) => ({
      type: 'function',
      function: fn,
    }));
  }

  if (Array.isArray(body.tools)) {
    if (body.tools.length > 100) {
      throw new GatewayError(400, 'Too many tools (max 100)');
    }
    body.tools = body.tools.map(normalizeFunctionToolDefinition);
    body.tools.forEach(validateFunctionTool);
    const names = new Set<string>();
    for (const tool of body.tools) {
      if (isObject(tool) && isObject(tool.function) && typeof tool.function.name === 'string') {
        if (names.has(tool.function.name)) {
          throw new GatewayError(400, `Duplicate tool name: ${tool.function.name}`);
        }
        names.add(tool.function.name);
      }
    }
    for (const tool of body.tools) {
      if (isObject(tool) && isObject(tool.function) && isObject(tool.function.parameters)) {
        validateSchemaSize(tool.function.parameters, 10000, 32);
      }
    }
  }

  if (body.function_call !== undefined && body.tool_choice === undefined) {
    if (body.function_call === 'none' || body.function_call === 'auto') {
      body.tool_choice = body.function_call;
    } else if (isObject(body.function_call) && typeof body.function_call.name === 'string') {
      body.tool_choice = {
        type: 'function',
        function: { name: body.function_call.name },
      };
    }
  }

  if (body.tool_choice !== undefined) {
    body.tool_choice = normalizeToolChoice(body.tool_choice);
  }

  delete body.functions;
  delete body.function_call;
}

function validateSchemaSize(schema: unknown, maxKeys: number, maxDepth: number, depth = 0, keyCount: { value: number } = { value: 0 }): void {
  if (depth > maxDepth) {
    throw new GatewayError(400, 'Tool schema exceeds maximum nesting depth (32)', 'invalid_request_error', 'invalid_tool_schema');
  }
  if (!isObject(schema)) return;
  for (const key of Object.keys(schema)) {
    keyCount.value++;
    if (keyCount.value > maxKeys) {
      throw new GatewayError(400, 'Tool schema exceeds maximum key count (10000)', 'invalid_request_error', 'invalid_tool_schema');
    }
    validateSchemaSize((schema as Record<string, unknown>)[key], maxKeys, maxDepth, depth + 1, keyCount);
  }
}

function normalizeFunctionToolDefinition(tool: unknown): unknown {
  if (!isObject(tool)) return tool;
  if (tool.type !== 'function' || isObject(tool.function)) return tool;
  if (typeof tool.name !== 'string' || tool.name.length === 0) return tool;
  return {
    ...tool,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      strict: tool.strict,
    },
  };
}

function validateFunctionTool(tool: unknown, index: number): void {
  if (!isObject(tool)) {
    throw new GatewayError(400, `tools[${index}] must be an object`);
  }
  if (tool.type === 'custom') {
    throw new GatewayError(400, 'custom tools are not supported by this upstream', 'invalid_request_error', 'unsupported_tool_type');
  }
  if (tool.type !== 'function' || !isObject(tool.function) || typeof tool.function.name !== 'string' || tool.function.name.length === 0) {
    throw new GatewayError(400, `tools[${index}] must be a function tool`);
  }
  if (tool.function.parameters !== undefined && !isObject(tool.function.parameters)) {
    throw new GatewayError(400, `tools[${index}].function.parameters must be an object`, 'invalid_request_error', 'invalid_tool_schema');
  }
}

function normalizeToolChoice(toolChoice: unknown): unknown {
  if (toolChoice === 'auto' || toolChoice === 'none' || toolChoice === 'required') return toolChoice;
  if (isObject(toolChoice) && toolChoice.type === 'function' && isObject(toolChoice.function) && typeof toolChoice.function.name === 'string') {
    return toolChoice;
  }
  if (isObject(toolChoice) && toolChoice.type === 'function' && typeof toolChoice.name === 'string') {
    return { type: 'function', function: { name: toolChoice.name } };
  }
  if (isObject(toolChoice) && toolChoice.type === 'tool' && typeof toolChoice.name === 'string') {
    return { type: 'function', function: { name: toolChoice.name } };
  }
  throw new GatewayError(400, 'tool_choice is not supported', 'invalid_request_error', 'unsupported_tool_choice');
}

export function normalizeOpenAIToolCalls(toolCalls: unknown): JsonObject[] | undefined {
  if (!Array.isArray(toolCalls)) return undefined;
  return toolCalls.map((toolCall, index) => normalizeOpenAIToolCall(toolCall, index));
}

export function openAIMessageToAnthropicContent(message: JsonObject): JsonObject[] {
  const content: JsonObject[] = [];
  if (typeof message.content === 'string' && message.content.length > 0) {
    content.push({ type: 'text', text: message.content });
  }
  const toolCalls = normalizeOpenAIToolCalls(message.tool_calls) ?? [];
  for (const toolCall of toolCalls) {
    content.push({
      type: 'tool_use',
      id: toolCall.id,
      name: toolCall.function.name,
      input: parseToolArguments(toolCall.function.arguments),
    });
  }
  return content;
}

export function normalizeAnthropicTools(tools: unknown): JsonObject[] | undefined {
  if (tools === undefined) return undefined;
  if (!Array.isArray(tools)) throw new GatewayError(400, 'tools must be an array');
  return tools.map((tool, index) => {
    if (!isObject(tool) || typeof tool.name !== 'string') {
      throw new GatewayError(400, `tools[${index}].name is required`);
    }
    if (!/^[A-Za-z0-9_-]+$/.test(tool.name)) {
      throw new GatewayError(400, `tools[${index}].name is invalid for OpenAI function calling`);
    }
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: typeof tool.description === 'string' ? tool.description : undefined,
        parameters: isObject(tool.input_schema) ? tool.input_schema : { type: 'object', properties: {} },
      },
    };
  });
}

export function parseToolArguments(argumentsValue: unknown): JsonObject {
  if (argumentsValue === undefined || argumentsValue === null || argumentsValue === '') return {};
  if (typeof argumentsValue === 'string') {
    try {
      const parsed = JSON.parse(argumentsValue);
      if (!isObject(parsed)) throw new Error('tool arguments must be an object');
      return parsed;
    } catch {
      throw upstreamError('bad_response', 'Invalid tool call arguments from upstream');
    }
  }
  if (isObject(argumentsValue)) return argumentsValue;
  throw upstreamError('bad_response', 'Invalid tool call arguments from upstream');
}

function normalizeOpenAIToolCall(toolCall: unknown, index: number): JsonObject {
  if (!isObject(toolCall)) {
    throw upstreamError('bad_response', 'Invalid tool call from upstream');
  }
  const fn = isObject(toolCall.function) ? toolCall.function : {};
  if (typeof fn.name !== 'string' || fn.name.length === 0) {
    throw upstreamError('bad_response', 'Tool call from upstream is missing a function name');
  }
  return {
    id: typeof toolCall.id === 'string' && toolCall.id.length > 0 ? toolCall.id : stableToolCallId(fn.name, index),
    type: 'function',
    function: {
      name: fn.name,
      arguments: normalizeToolArguments(fn.arguments),
    },
  };
}

function normalizeToolArguments(argumentsValue: unknown): string {
  if (argumentsValue === undefined || argumentsValue === null || argumentsValue === '') return '{}';
  if (typeof argumentsValue === 'string') {
    parseToolArguments(argumentsValue);
    return argumentsValue;
  }
  if (isObject(argumentsValue)) return JSON.stringify(argumentsValue);
  throw upstreamError('bad_response', 'Invalid tool call arguments from upstream');
}

function stableToolCallId(name: string, index: number): string {
  return `call_${name.replace(/[^A-Za-z0-9_-]/g, '_')}_${index}`;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
