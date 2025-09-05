import { describe, it, expect, vi, afterEach } from 'vitest';
import { getOllamaHealth } from './index';

const originalEnv = { ...process.env };

type TagsResponse = {
  ok: boolean;
  json?: () => Promise<{ models: { name: string }[] }>;
};

describe('getOllamaHealth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it('returns ok with models when service healthy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (): Promise<TagsResponse> =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                models: [{ name: 'model1' }, { name: 'model2' }],
              }),
          })
      )
    );

    const res = await getOllamaHealth();
    expect(res).toEqual({ status: 'ok', models: ['model1', 'model2'] });
  });

  it('returns error when service not responding', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((): Promise<TagsResponse> => Promise.resolve({ ok: false }))
    );
    const res = await getOllamaHealth();
    expect(res).toEqual({
      status: 'error',
      message: 'Ollama is not responding',
    });
  });

  it('returns error when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network')))
    );
    const res = await getOllamaHealth();
    expect(res).toEqual({
      status: 'error',
      message: 'Ollama is not reachable',
    });
  });
});
