import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChromaConfig, EmbeddingOpts } from './types';

const embeddingCalls: EmbeddingOpts[] = [];
const chromaCalls: {
  embeddings: unknown;
  config: ChromaConfig;
  asRetrieverCalls: number;
}[] = [];

vi.mock('@langchain/ollama', () => ({
  OllamaEmbeddings: vi.fn(function (this: EmbeddingOpts, opts: EmbeddingOpts) {
    embeddingCalls.push(opts);
    this.model = opts.model;
    this.baseUrl = opts.baseUrl;
  }),
}));

vi.mock('@langchain/community/vectorstores/chroma', () => ({
  Chroma: vi.fn(function (
    this: { asRetriever: () => unknown },
    embeddings: unknown,
    config: ChromaConfig
  ) {
    chromaCalls.push({ embeddings, config, asRetrieverCalls: 0 });
    this.asRetriever = vi.fn(() => {
      chromaCalls[chromaCalls.length - 1].asRetrieverCalls += 1;
      return { kind: 'retriever', index: chromaCalls.length };
    });
  }),
}));

async function importModule() {
  const mod = await import('./retrieval');
  return mod;
}

describe('getVectorStoreRetriever', () => {
  beforeEach(() => {
    vi.resetModules();
    embeddingCalls.length = 0;
    chromaCalls.length = 0;
    process.env.OLLAMA_EMBED_MODEL = 'nomic-embed-text';
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
    process.env.CHROMA_COLLECTION_NAME = 'test_collection';
    process.env.CHROMA_URL = 'http://localhost:8000';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('constructs OllamaEmbeddings and Chroma with expected env vars', async () => {
    const { getVectorStoreRetriever } = await importModule();
    const retriever = await getVectorStoreRetriever();

    expect(embeddingCalls).toHaveLength(1);
    expect(embeddingCalls[0]).toEqual({
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434',
    });

    expect(chromaCalls).toHaveLength(1);
    expect(chromaCalls[0].config).toEqual({
      collectionName: 'test_collection',
      url: 'http://localhost:8000',
    });

    expect(retriever).toEqual({ kind: 'retriever', index: 1 });
    expect(chromaCalls[0].asRetrieverCalls).toBe(1);
  });

  it('creates new embeddings and chroma instances on each call', async () => {
    const { getVectorStoreRetriever } = await importModule();
    const r1 = await getVectorStoreRetriever();
    const r2 = await getVectorStoreRetriever();

    expect(embeddingCalls).toHaveLength(2);
    expect(chromaCalls).toHaveLength(2);
    expect(r1).not.toBe(r2);
    expect(r1).toEqual({ kind: 'retriever', index: 1 });
    expect(r2).toEqual({ kind: 'retriever', index: 2 });
  });

  it('passes through undefined env vars when not set', async () => {
    delete process.env.OLLAMA_EMBED_MODEL;
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.CHROMA_COLLECTION_NAME;
    delete process.env.CHROMA_URL;

    const { getVectorStoreRetriever } = await importModule();
    await getVectorStoreRetriever();

    expect(embeddingCalls[0]).toEqual({ model: undefined, baseUrl: undefined });
    expect(chromaCalls[0].config).toEqual({
      collectionName: undefined,
      url: undefined,
    });
  });
});
