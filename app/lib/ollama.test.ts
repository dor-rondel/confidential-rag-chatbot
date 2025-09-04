import { describe, it, expect, vi } from 'vitest';
import { getOllamaHealth } from './ollama';

describe('getOllamaHealth', () => {
  it('should return ok with models if ollama is healthy', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              models: [{ name: 'model1' }, { name: 'model2' }],
            }),
        })
      )
    );

    const health = await getOllamaHealth();
    expect(health).toEqual({ status: 'ok', models: ['model1', 'model2'] });
  });

  it('should return an error if ollama is not responding', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
        })
      )
    );

    const health = await getOllamaHealth();
    expect(health).toEqual({
      status: 'error',
      message: 'Ollama is not responding',
    });
  });

  it('should return an error if ollama is not reachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network error')))
    );

    const health = await getOllamaHealth();
    expect(health).toEqual({
      status: 'error',
      message: 'Ollama is not reachable',
    });
  });
});
