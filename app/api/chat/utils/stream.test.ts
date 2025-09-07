import { describe, it, expect, vi } from 'vitest';
import { createChatEventStream } from './stream';
import type { Message } from '@/app/lib/types';
import type { StreamRunnable } from './types';

// Mock sharedMemory
vi.mock('@/app/lib/langchain/memory', () => ({
  sharedMemory: {
    saveContext: vi.fn().mockResolvedValue(undefined),
    loadMemoryVariables: vi.fn().mockResolvedValue({ chat_history: [] }),
  },
}));

// Utility to read all chunks from a ReadableStream<Uint8Array>
async function readStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) result += decoder.decode(value, { stream: true });
  }
  return result;
}

describe('createChatEventStream', () => {
  const baseMessage: Message = { id: '1', role: 'user', content: 'hi' };

  it('streams started, token(s), done events in order', async () => {
    const fakeChain: StreamRunnable = {
      stream: vi.fn(async function* _gen() {
        yield 'Hello';
        yield ' World';
      }),
    };

    const stream = createChatEventStream({
      question: 'Hello world?',
      contextText: 'ctx',
      latestMessage: baseMessage,
      chain: fakeChain,
    });

    const output = await readStream(stream);
    // Ensure order and payload structure
    expect(output).toContain('event: meta');
    expect(output.indexOf('"status":"started"')).toBeGreaterThan(-1);
    const firstTokenIdx = output.indexOf('event: token');
    const doneIdx = output.indexOf('"status":"done"');
    expect(firstTokenIdx).toBeGreaterThan(-1);
    expect(doneIdx).toBeGreaterThan(firstTokenIdx);
    expect(output).toContain('Hello');
    expect(output).toContain('World');
  });

  it('persists memory with full aggregated response', async () => {
    const fakeChain: StreamRunnable = {
      stream: vi.fn(async function* _gen() {
        yield 'A';
        yield 'B';
      }),
    };
    const stream = createChatEventStream({
      question: 'Q?',
      contextText: 'ctx',
      latestMessage: baseMessage,
      chain: fakeChain,
    });
    await readStream(stream);
    const { sharedMemory } = await import('@/app/lib/langchain/memory');
    expect(sharedMemory.saveContext).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sharedMemory.saveContext).mock.calls[0][1]).toStrictEqual({
      output: 'AB',
    });
  });

  it('emits error event when chain.stream throws', async () => {
    const fakeChain: StreamRunnable = {
      stream: vi.fn(async () => {
        throw new Error('boom');
      }),
    };
    const stream = createChatEventStream({
      question: 'Q?',
      contextText: 'ctx',
      latestMessage: baseMessage,
      chain: fakeChain,
    });
    const output = await readStream(stream);
    expect(output).toContain('event: error');
    expect(output).toContain('"status":"error"');
    expect(output).toContain('boom');
  });

  it('continues on empty string tokens but preserves spaces', async () => {
    const fakeChain: StreamRunnable = {
      stream: vi.fn(async function* _gen() {
        yield '';
        yield ' ';
        yield 'X';
      }),
    };
    const stream = createChatEventStream({
      question: 'Q?',
      contextText: 'ctx',
      latestMessage: baseMessage,
      chain: fakeChain,
    });
    const output = await readStream(stream);
    const tokenFrames = output
      .split('\n\n')
      .filter(f => f.startsWith('event: token'));
    // Assert no frame has empty data after 'data: '
    const emptyFrames = tokenFrames.filter(f =>
      /^event: token\ndata: $/.test(f)
    );
    expect(emptyFrames).toHaveLength(0);
    // Space-only token present
    expect(tokenFrames.some(f => f === 'event: token\ndata:  ')).toBe(true);
    // 'X' token present
    expect(tokenFrames.some(f => f === 'event: token\ndata: X')).toBe(true);
  });
});
