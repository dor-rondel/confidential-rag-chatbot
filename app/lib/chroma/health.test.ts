import { describe, it, expect, vi } from 'vitest';
import { getChromaHealth } from './health';
import { getChromaClient } from './client';

vi.mock('./client', () => ({
  getChromaClient: vi.fn(),
}));

type MockChromaClient = { heartbeat: () => Promise<boolean> };

// Helper to set heartbeat behavior on mocked client
const setHeartbeat = (impl: () => Promise<boolean>) => {
  const client: MockChromaClient = { heartbeat: impl };
  vi.mocked(getChromaClient).mockReturnValue(
    client as unknown as ReturnType<typeof getChromaClient>
  );
};

describe('getChromaHealth (chroma/health)', () => {
  it('returns ok when heartbeat succeeds', async () => {
    setHeartbeat(async () => true);
    const health = await getChromaHealth();
    expect(health).toEqual({ status: 'ok' });
  });

  it('returns error when heartbeat returns false', async () => {
    setHeartbeat(async () => false);
    const health = await getChromaHealth();
    expect(health).toEqual({
      status: 'error',
      message: 'ChromaDB is not responding',
    });
  });

  it('returns error when heartbeat throws', async () => {
    setHeartbeat(async () => {
      throw new Error('network');
    });
    const health = await getChromaHealth();
    expect(health).toEqual({
      status: 'error',
      message: 'ChromaDB is not reachable',
    });
  });
});
