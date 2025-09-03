import { describe, it, expect, vi } from 'vitest';
import type { Document } from 'langchain/document';

// Hoisted shared mutable state to satisfy Vitest's mock hoisting rules
const state = vi.hoisted(() => ({
  lastSplitterInstance: null as null | {
    splitDocuments: ReturnType<typeof vi.fn>;
  },
  lastEmbeddingsInstance: null as null | { config: unknown },
  fromDocumentsMock: vi.fn(),
}));

vi.mock('@langchain/ollama', () => {
  const OllamaEmbeddings = vi.fn().mockImplementation((config: unknown) => {
    state.lastEmbeddingsInstance = { config };
    return state.lastEmbeddingsInstance as unknown as Record<string, unknown>;
  });
  return { OllamaEmbeddings };
});

vi.mock('langchain/text_splitter', () => {
  const RecursiveCharacterTextSplitter = vi.fn().mockImplementation(() => {
    state.lastSplitterInstance = { splitDocuments: vi.fn() };
    return state.lastSplitterInstance;
  });
  return { RecursiveCharacterTextSplitter };
});

vi.mock('@langchain/community/vectorstores/chroma', () => ({
  Chroma: { fromDocuments: state.fromDocumentsMock },
}));

vi.mock('langchain/document', () => {
  class Document {
    pageContent: string;
    metadata: Record<string, unknown>;
    constructor({
      pageContent,
      metadata = {},
    }: {
      pageContent: string;
      metadata?: Record<string, unknown>;
    }) {
      this.pageContent = pageContent;
      this.metadata = metadata;
    }
  }
  return { Document };
});

// Import after mocks so module-level singletons use mocked classes
import { ingestDocument } from './ingestion';

// Utilities
function createMockFile({
  name,
  type = 'text/plain',
  content,
}: {
  name: string;
  type?: string;
  content: string;
}): File {
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

type MockChunk = { pageContent: string; metadata: Record<string, unknown> };

describe('ingestDocument', () => {
  it('ingests a normal text file and stores chunk embeddings', async () => {
    const file = createMockFile({
      name: 'test.txt',
      content: 'Hello world. This is a test.',
    });

    expect(state.lastSplitterInstance).not.toBe(null);
    const chunks: MockChunk[] = [
      { pageContent: 'Hello world.', metadata: { chunk: 0 } },
      { pageContent: 'This is a test.', metadata: { chunk: 1 } },
    ];
    vi.mocked(state.lastSplitterInstance!.splitDocuments).mockResolvedValueOnce(
      chunks as unknown as Document[]
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await ingestDocument(file);

    expect(state.lastEmbeddingsInstance).not.toBeNull();
    expect(state.lastEmbeddingsInstance!.config).toStrictEqual({
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434',
    });

    expect(state.lastSplitterInstance!.splitDocuments).toHaveBeenCalledTimes(1);
    const docsArg = vi.mocked(state.lastSplitterInstance!.splitDocuments).mock
      .calls[0][0];
    expect(Array.isArray(docsArg)).toBe(true);
    expect(docsArg).toHaveLength(1);
    expect(docsArg[0].pageContent).toBe('Hello world. This is a test.');
    expect(docsArg[0].metadata).toStrictEqual({
      name: 'test.txt',
      type: 'text/plain',
      size: file.size,
    });

    expect(state.fromDocumentsMock).toHaveBeenCalledTimes(1);
    const [passedChunks, embeddingsInstance, options] =
      state.fromDocumentsMock.mock.calls[0];
    expect(passedChunks).toStrictEqual(chunks);
    expect(embeddingsInstance).toBe(state.lastEmbeddingsInstance);
    expect(options).toStrictEqual({
      collectionName: 'rag-collection',
      url: 'http://localhost:8000',
    });

    expect(logSpy).toHaveBeenCalledWith(
      'Successfully ingested 2 chunks from test.txt.'
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('propagates a standardized error when ingestion fails', async () => {
    const file = createMockFile({ name: 'bad.txt', content: 'Broken file' });

    expect(state.lastSplitterInstance).not.toBe(null);
    const chunks: MockChunk[] = [
      { pageContent: 'Broken file', metadata: { chunk: 0 } },
    ];
    vi.mocked(state.lastSplitterInstance!.splitDocuments).mockResolvedValueOnce(
      chunks as unknown as Document[]
    );

    const injectedError = new Error('Vector store unreachable');
    state.fromDocumentsMock.mockRejectedValueOnce(injectedError);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(ingestDocument(file)).rejects.toThrow(
      'Failed to ingest document. Please check the logs.'
    );

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const [prefix, errObj] = errorSpy.mock.calls[0];
    expect(prefix).toBe('Ingestion failed:');
    expect(errObj).toBe(injectedError);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('handles empty file content (0 chunks) gracefully', async () => {
    const file = createMockFile({ name: 'empty.txt', content: '' });

    expect(state.lastSplitterInstance).not.toBe(null);
    vi.mocked(state.lastSplitterInstance!.splitDocuments).mockResolvedValueOnce(
      [] as unknown as Document[]
    );

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await ingestDocument(file);

    expect(state.fromDocumentsMock).toHaveBeenCalledTimes(1);
    const [passedChunks] = state.fromDocumentsMock.mock.calls[0];
    expect(passedChunks).toStrictEqual([]);
    expect(logSpy).toHaveBeenCalledWith(
      'Successfully ingested 0 chunks from empty.txt.'
    );
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
