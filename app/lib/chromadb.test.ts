import { describe, it, expect, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { getChromaHealth } from './chromadb';

type ChromaClientLike = {
  heartbeat: () => Promise<boolean>;
};

type ChromaClientFactory = () => ChromaClientLike;

vi.mock('chromadb', () => ({
  ChromaClient: vi.fn(),
}));

const getChromaClientMock = async (): Promise<
  MockInstance<ChromaClientFactory>
> => {
  const { ChromaClient } = await import('chromadb');
  return ChromaClient as unknown as MockInstance<ChromaClientFactory>;
};

const setHeartbeat = async (impl: () => Promise<boolean>) => {
  const ctor = await getChromaClientMock();
  ctor.mockImplementation(() => ({ heartbeat: impl }));
};

describe('getChromaHealth', () => {
  it('should return ok if chroma is alive', async () => {
    await setHeartbeat(async () => true);
    const health = await getChromaHealth();
    expect(health).toEqual({ status: 'ok' });
  });

  it('should return an error if chroma is not responding', async () => {
    await setHeartbeat(async () => false);
    const health = await getChromaHealth();
    expect(health).toEqual({
      status: 'error',
      message: 'ChromaDB is not responding',
    });
  });

  it('should return an error if chroma is not reachable', async () => {
    await setHeartbeat(async () => {
      throw new Error('network error');
    });
    const health = await getChromaHealth();
    expect(health).toEqual({
      status: 'error',
      message: 'ChromaDB is not reachable',
    });
  });
});
