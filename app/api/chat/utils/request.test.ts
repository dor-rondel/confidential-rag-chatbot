import { describe, it, expect } from 'vitest';
import { readChatRequest, HttpError } from './request';
import type { NextRequest } from 'next/server';

type FakeNextRequest = Pick<NextRequest, 'json'>;

function makeRequest(jsonImpl: () => Promise<unknown>): FakeNextRequest {
  return { json: jsonImpl } as unknown as FakeNextRequest;
}

describe('readChatRequest', () => {
  it('parses a valid request', async () => {
    const req = makeRequest(async () => ({
      messages: [
        { id: '1', role: 'assistant', content: 'hi' },
        { id: '2', role: 'user', content: '  hello world  ' },
      ],
    }));
    const result = await readChatRequest(req as unknown as NextRequest);
    expect(result.question).toBe('hello world');
    expect(result.latestMessage.id).toBe('2');
    expect(result.messages).toHaveLength(2);
  });

  it('throws on invalid JSON', async () => {
    const req = makeRequest(async () => {
      throw new Error('parse');
    });
    await expect(
      readChatRequest(req as unknown as NextRequest)
    ).rejects.toStrictEqual(new HttpError(400, 'Invalid JSON'));
  });

  it('throws when body missing messages property', async () => {
    const req = makeRequest(async () => ({}));
    await expect(
      readChatRequest(req as unknown as NextRequest)
    ).rejects.toStrictEqual(new HttpError(400, 'Missing messages'));
  });

  it('throws when messages array empty', async () => {
    const req = makeRequest(async () => ({ messages: [] }));
    await expect(
      readChatRequest(req as unknown as NextRequest)
    ).rejects.toStrictEqual(new HttpError(400, 'Missing messages'));
  });

  it('throws when latest user message trims to empty', async () => {
    const req = makeRequest(async () => ({
      messages: [{ id: '1', role: 'user', content: '   ' }],
    }));
    await expect(
      readChatRequest(req as unknown as NextRequest)
    ).rejects.toStrictEqual(new HttpError(400, 'Empty question'));
  });
});
