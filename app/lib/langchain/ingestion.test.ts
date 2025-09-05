import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { Document } from '@langchain/core/documents';

// Shared state for splitter + vector store + captured embeddings config
const state = vi.hoisted(() => ({
  splitter: null as null | { splitDocuments: ReturnType<typeof vi.fn> },
  fromDocumentsMock: vi.fn(),
}));

// Wrap actual module to keep types (defensive) while spying on constructor args
vi.mock('@langchain/ollama', async () => {
  const actual: Record<string, unknown> =
    await vi.importActual('@langchain/ollama');
  return {
    ...actual,
    OllamaEmbeddings: vi.fn().mockImplementation((config: unknown) => ({
      __mock: true,
      config,
    })),
  };
});

vi.mock('@langchain/textsplitters', () => {
  const RecursiveCharacterTextSplitter = vi.fn().mockImplementation(() => {
    state.splitter = { splitDocuments: vi.fn() };
    return state.splitter;
  });
  return { RecursiveCharacterTextSplitter };
});

vi.mock('@langchain/community/vectorstores/chroma', () => ({
  Chroma: { fromDocuments: state.fromDocumentsMock },
}));

vi.mock('@langchain/core/documents', () => {
  class Document {
    pageContent: string;
    metadata: Record<string, unknown>;
    constructor(opts: {
      pageContent: string;
      metadata?: Record<string, unknown>;
    }) {
      this.pageContent = opts.pageContent;
      this.metadata = opts.metadata ?? {};
    }
  }
  return { Document };
});

let ingestDocument: typeof import('./ingestion').ingestDocument;

beforeAll(async () => {
  process.env.OLLAMA_EMBED_MODEL = 'nomic-embed-text';
  process.env.OLLAMA_BASE_URL = 'http://localhost:11435';
  process.env.CHROMA_COLLECTION_NAME = 'rag-collection';
  process.env.CHROMA_URL = 'http://localhost:8000';
  ({ ingestDocument } = await import('./ingestion'));
});

function makeFile(name: string, content: string, type = 'text/plain'): File {
  const data = content;
  const fileLike: Partial<File> = {
    name,
    type,
    size: Buffer.byteLength(data, 'utf8'),
    lastModified: Date.now(),
    text: async () => data,
    arrayBuffer: async () => new TextEncoder().encode(data).buffer,
    slice: () => new Blob([data], { type }),
    stream: () => new Blob([data], { type }).stream(),
  };
  return fileLike as File;
}

describe('ingestDocument', () => {
  it('stores chunk embeddings in ChromaDB', async () => {
    const file = makeFile('test.txt', 'Hello world. This is a test.');

    const chunks = [
      { pageContent: 'Hello world.', metadata: { chunk: 0 } },
      { pageContent: 'This is a test.', metadata: { chunk: 1 } },
    ];
    expect(state.splitter).not.toBeNull();
    vi.mocked(state.splitter!.splitDocuments).mockResolvedValueOnce(
      chunks as unknown as Document[]
    );
    state.fromDocumentsMock.mockResolvedValueOnce(undefined);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await ingestDocument(file);

    const { OllamaEmbeddings } = await import('@langchain/ollama');
    expect(vi.mocked(OllamaEmbeddings).mock.calls).toHaveLength(1);
    expect(vi.mocked(OllamaEmbeddings).mock.calls[0][0]).toStrictEqual({
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11435',
    });

    expect(state.splitter!.splitDocuments).toHaveBeenCalledTimes(1);
    const firstCallArg = vi.mocked(state.splitter!.splitDocuments).mock
      .calls[0][0];
    expect(Array.isArray(firstCallArg)).toBe(true);
    expect(firstCallArg).toHaveLength(1);
    expect(firstCallArg[0].pageContent).toBe('Hello world. This is a test.');

    expect(state.fromDocumentsMock).toHaveBeenCalledTimes(1);
    const [passedChunks, , options] = state.fromDocumentsMock.mock.calls[0];
    expect(passedChunks).toStrictEqual(chunks);
    // Embeddings constructor called once; embeddings instance passed as 2nd arg (not asserting shape due to constructor wrapping)
    expect(options).toStrictEqual({
      collectionName: 'rag-collection',
      url: 'http://localhost:8000',
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Successfully ingested 2 chunks from test.txt.'
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
