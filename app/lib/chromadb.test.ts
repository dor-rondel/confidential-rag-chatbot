import { describe, it, expect, vi } from 'vitest';
import { getChromaHealth } from './chromadb';

vi.mock('chromadb', () => ({
  ChromaClient: vi.fn(),
}));

describe('getChromaHealth', () => {
  it('should return ok if chroma is alive', async () => {
    const { ChromaClient } = await import('chromadb');
    (ChromaClient as any).mockImplementation(() => ({
      heartbeat: async () => true,
    }));

    const health = await getChromaHealth();
    expect(health).toEqual({ status: 'ok' });
  });

  it('should return an error if chroma is not responding', async () => {
    const { ChromaClient } = await import('chromadb');
    (ChromaClient as any).mockImplementation(() => ({
      heartbeat: async () => false,
    }));

    const health = await getChromaHealth();
    expect(health).toEqual({ status: 'error', message: 'ChromaDB is not responding' });
  });

  it('should return an error if chroma is not reachable', async () => {
    const { ChromaClient } = await import('chromadb');
    (ChromaClient as any).mockImplementation(() => ({
      heartbeat: async () => {
        throw new Error('network error');
      },
    }));

    const health = await getChromaHealth();
    expect(health).toEqual({ status: 'error', message: 'ChromaDB is not reachable' });
  });
});
