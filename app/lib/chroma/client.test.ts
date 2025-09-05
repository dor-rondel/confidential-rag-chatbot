import { describe, it, expect, vi, type Mock } from 'vitest';

// Mock the chromadb package so we can inspect constructor calls
vi.mock('chromadb', () => ({
  ChromaClient: vi.fn().mockImplementation(() => ({ heartbeat: vi.fn() })),
}));

async function importClient() {
  const { getChromaClient } = await import('./client');
  const { ChromaClient } = await import('chromadb');
  // Cast the imported constructor to a Vitest Mock for call assertions
  return { getChromaClient, ChromaClient: ChromaClient as unknown as Mock };
}

describe('getChromaClient singleton', () => {
  it('returns a singleton instance', async () => {
    const { getChromaClient, ChromaClient } = await importClient();

    const first = getChromaClient();
    expect(first).toBeDefined();
    expect(ChromaClient).toHaveBeenCalledTimes(1);

    const second = getChromaClient();
    expect(second).toBe(first);
    expect(ChromaClient).toHaveBeenCalledTimes(1); // still 1, no new construction
  });

  it('recreates a new instance after module reset', async () => {
    // Because Vitest clears mock call history between tests but preserves the module cache,
    // the first access here will return the existing singleton without invoking the constructor again.
    const initial = await importClient();
    const inst1 = initial.getChromaClient();
    expect(inst1).toBeDefined();
    expect(initial.ChromaClient).toHaveBeenCalledTimes(0); // no new construction yet

    // Reset module cache to clear the internal _client variable
    vi.resetModules();

    // Reapply the mock after resetting modules so new imports use a mocked constructor
    vi.mock('chromadb', () => ({
      ChromaClient: vi.fn().mockImplementation(() => ({ heartbeat: vi.fn() })),
    }));

    const afterReset = await importClient();
    const inst2 = afterReset.getChromaClient();
    expect(afterReset.ChromaClient).toHaveBeenCalledTimes(1); // fresh construction
    expect(inst2).not.toBe(inst1);
  });
});
