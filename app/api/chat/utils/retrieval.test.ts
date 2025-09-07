import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retrieveContext } from './retrieval';
import type { RetrieverLike } from './types';

vi.mock('@/app/lib/langchain/retrieval', () => ({
  getVectorStoreRetriever: vi.fn(),
}));

import { getVectorStoreRetriever } from '@/app/lib/langchain/retrieval';

function makeMockRetriever(): RetrieverLike {
  const impl = async (q: string) => [
    { pageContent: `doc for ${q} #1` },
    { pageContent: `doc for ${q} #2` },
  ];
  return { invoke: impl };
}

beforeEach(() => {
  // Cast only this assignment to unknown to satisfy strict typing while keeping test logic clean.
  (
    getVectorStoreRetriever as unknown as {
      mockResolvedValue: (v: unknown) => void;
    }
  ).mockResolvedValue(makeMockRetriever());
});

describe('retrieveContext', () => {
  it('returns documents and joined context text', async () => {
    const { documents, contextText } = await retrieveContext('question');
    expect(documents).toHaveLength(2);
    expect(contextText).toBe('doc for question #1\n\ndoc for question #2');
  });

  it('invokes retriever with question', async () => {
    await retrieveContext('foo');
    expect(
      (getVectorStoreRetriever as unknown as { mock: { calls: unknown[] } })
        .mock.calls.length
    ).toBe(1);
  });
});
