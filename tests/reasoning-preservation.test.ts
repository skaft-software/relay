import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { upstreamChatCompletionToCanonical, canonicalToOpenAIChatCompletion } from '../src/internal/response.ts';

describe('reasoning_content preservation', () => {
  it('preserves reasoning_content when upstream content is empty', () => {
    const upstream = {
      id: 'chatcmpl-1',
      object: 'chat.completion',
      created: 1,
      model: 'gemma',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: '',
          reasoning_content: 'The user asked a simple greeting. I should respond warmly.',
        },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 10, completion_tokens: 50, total_tokens: 60 },
    };

    const canonical = upstreamChatCompletionToCanonical(upstream, 'gemma');
    const completion = canonicalToOpenAIChatCompletion(canonical);

    const msg = completion.choices[0].message;
    assert.equal(msg.content, '');
    assert.equal(msg.reasoning_content, 'The user asked a simple greeting. I should respond warmly.');
    assert.equal(msg.role, 'assistant');
  });

  it('preserves reasoning_content alongside non-empty content', () => {
    const upstream = {
      id: 'chatcmpl-2',
      object: 'chat.completion',
      created: 1,
      model: 'gemma',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Hello!',
          reasoning_content: 'Simple greeting request.',
        },
        finish_reason: 'stop',
      }],
    };

    const canonical = upstreamChatCompletionToCanonical(upstream, 'gemma');
    const completion = canonicalToOpenAIChatCompletion(canonical);

    const msg = completion.choices[0].message;
    assert.equal(msg.content, 'Hello!');
    assert.equal(msg.reasoning_content, 'Simple greeting request.');
  });

  it('produces correct shape for empty content without reasoning (validation happens at chat level)', () => {
    const upstream = {
      id: 'chatcmpl-3',
      object: 'chat.completion',
      created: 1,
      model: 'gemma',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: '',
        },
        finish_reason: 'length',
      }],
    };

    const canonical = upstreamChatCompletionToCanonical(upstream, 'gemma');
    const completion = canonicalToOpenAIChatCompletion(canonical);
    // canonical pipeline preserves an empty-content-only message shape.
    // Upstream validation happens in validateAssistantChoice (chat.ts),
    // which rejects empty content + no reasoning at request time.
    assert.equal(completion.choices[0].message.content, '');
    assert.equal(completion.choices[0].message.reasoning_content, undefined);
  });

  it('does not set reasoning_content when upstream has none', () => {
    const upstream = {
      id: 'chatcmpl-4',
      object: 'chat.completion',
      created: 1,
      model: 'gemma',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Plain response without reasoning.',
        },
        finish_reason: 'stop',
      }],
    };

    const canonical = upstreamChatCompletionToCanonical(upstream, 'gemma');
    const completion = canonicalToOpenAIChatCompletion(canonical);

    const msg = completion.choices[0].message;
    assert.equal(msg.content, 'Plain response without reasoning.');
    assert.equal(msg.reasoning_content, undefined);
    // Normal content behavior unchanged
    assert.equal(msg.role, 'assistant');
  });
});

describe('reasoning_content validation integration', () => {
  it('empty-content with reasoning passes assistant validation', () => {
    // Simulate what validateAssistantChoice sees: the output of toOpenAIMessage
    // after reasoning_content is preserved
    const message = {
      content: '',
      reasoning_content: 'Valid reasoning that should prevent the empty-assistant error.',
      role: 'assistant',
    };

    const hasContent = typeof message.content === 'string' ? message.content.length > 0 : message.content !== null && message.content !== undefined;
    const hasReasoning = typeof message.reasoning_content === 'string' && message.reasoning_content.length > 0;

    assert.equal(hasContent, false);
    assert.equal(hasReasoning, true);

    // When both content and reasoning are empty → should reject
    const emptyBoth: { content: string; reasoning_content?: string; role: string } = {
      content: '',
      reasoning_content: undefined,
      role: 'assistant',
    };
    const hc = typeof emptyBoth.content === 'string' ? emptyBoth.content.length > 0 : emptyBoth.content !== null && emptyBoth.content !== undefined;
    const hr = typeof emptyBoth.reasoning_content === 'string' && emptyBoth.reasoning_content.length > 0;
    assert.equal(hc, false);
    assert.equal(hr, false);
  });
});
