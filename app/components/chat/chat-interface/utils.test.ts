import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildUserMessage,
  createSSEReader,
  integrateChunkEvent,
  finalizeBuffer,
  fetchChatStream,
  processSSEStream,
  type SSEEvent,
} from './utils';
import type { Message as MessageType } from '@/app/lib/types';

// Helper to build a ReadableStream from string chunks
function streamFromStrings(chunks: string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
}

type ReaderLike = AsyncGenerator<SSEEvent, void, unknown> & {
  getRemainder: () => string;
};

describe('chat-interface utils', () => {
  describe('buildUserMessage', () => {
    it('trims input and sets incremental id', () => {
      const base: MessageType[] = [
        { id: '1', role: 'user', content: 'hello' },
        { id: '2', role: 'assistant', content: 'hi' },
      ];
      const msg = buildUserMessage(base, '  new question  ');
      expect(msg).toStrictEqual({
        id: '3',
        role: 'user',
        content: 'new question',
      });
    });
  });

  describe('createSSEReader', () => {
    it('parses token, error, meta(done) events in order', async () => {
      const frames = [
        'event: token\ndata: One\n\n',
        'event: error\ndata: {"status":"error","message":"fail"}\n\n',
        'event: meta\ndata: {"status":"started"}\n\n',
        'event: token\ndata: Two\n\n',
        'event: meta\ndata: {"status":"done"}\n\n',
      ];
      const rs = streamFromStrings(frames);
      const reader = createSSEReader(rs.getReader());
      const events: SSEEvent[] = [];
      for await (const e of reader) events.push(e);
      expect(events).toHaveLength(5);
      expect(events[0]).toStrictEqual({ type: 'token', data: ' One'.slice(1) });
      expect(events[1]).toStrictEqual({
        type: 'error',
        data: { status: 'error', message: 'fail' },
      });
      expect(events[2]).toStrictEqual({
        type: 'meta',
        data: { status: 'started' },
      });
      expect(events[3]).toStrictEqual({ type: 'token', data: ' Two'.slice(1) });
      expect(events[4]).toStrictEqual({
        type: 'meta',
        data: { status: 'done' },
      });
      expect(reader.getRemainder()).toBe('');
    });

    it('retains remainder for partial frame and ignores malformed meta/error JSON', async () => {
      const frames = [
        'event: meta\ndata: {notjson}\n\n',
        'event: error\ndata: {notjson}\n\n',
        'event: token\ndata: Complete\n\n',
        'event: token\ndata: Partial',
      ];
      const rs = streamFromStrings(frames);
      const reader = createSSEReader(rs.getReader());
      const events: SSEEvent[] = [];
      for await (const e of reader) events.push(e);
      expect(events.map(e => e.type)).toStrictEqual([
        'error',
        'token',
        'token',
      ]);
      if (events[0].type === 'error') {
        expect(events[0].data).toStrictEqual({
          status: 'error',
          message: 'Unknown error',
        });
      }
      expect(events[1]).toStrictEqual({
        type: 'token',
        data: ' Complete'.slice(1),
      });
      expect(reader.getRemainder()).toBe('event: token\ndata: Partial');
    });
  });

  describe('integrateChunkEvent', () => {
    it('concatenates chunk and invokes update callback', () => {
      const update = vi.fn();
      const result = integrateChunkEvent('B', 'A', update);
      expect(result).toBe('AB');
      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith('AB');
    });
  });

  describe('finalizeBuffer', () => {
    it('returns current when remainder empty', () => {
      expect(finalizeBuffer('', 'ABC')).toBe('ABC');
    });
    it('appends remainder when present', () => {
      expect(finalizeBuffer('XYZ', 'ABC')).toBe('ABCXYZ');
    });
  });

  describe('fetchChatStream', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    it('returns response when ok and has body', async () => {
      const body = streamFromStrings([
        'event: meta\ndata: {"status":"started"}\n\n',
      ]);
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(body, { status: 200 })
      );
      const res = await fetchChatStream([]);
      expect(res.status).toBe(200);
      expect(res.body).not.toBeNull();
    });

    it('throws on non-ok response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 500 })
      );
      await expect(fetchChatStream([])).rejects.toThrow('Network error');
    });

    it('throws when body missing', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(null, { status: 200 })
      );
      const res = await fetch('/api/chat');
      Object.defineProperty(res, 'body', { value: null });
      vi.mocked(fetch).mockResolvedValueOnce(res as Response);
      await expect(fetchChatStream([])).rejects.toThrow('Network error');
    });
  });

  describe('processSSEStream', () => {
    it('aggregates tokens, handles error marker, and fires callbacks on done', async () => {
      const tokenCb = vi.fn();
      const errorCb = vi.fn();
      const doneCb = vi.fn();
      const gen = (async function* () {
        yield { type: 'token', data: 'A' } as const;
        yield {
          type: 'error',
          data: { status: 'error', message: 'fail' },
        } as const;
        yield { type: 'token', data: 'B' } as const;
        yield { type: 'meta', data: { status: 'done' } } as const;
      })();
      const reader: ReaderLike = Object.assign(gen, { getRemainder: () => '' });
      const final = await processSSEStream(reader, tokenCb, errorCb, doneCb);
      expect(final).toBe('A\n[Error]\nB');
      expect(tokenCb).toHaveBeenCalledTimes(2);
      expect(errorCb).toHaveBeenCalledTimes(1);
      expect(doneCb).toHaveBeenCalledTimes(1);
      expect(doneCb).toHaveBeenCalledWith('A\n[Error]\nB');
    });
  });
});
