import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { getOllamaHealth } from '@/app/lib/ollama';
import { getChromaHealth } from '@/app/lib/chromadb';

vi.mock('@/app/lib/ollama', () => ({
  getOllamaHealth: vi.fn(),
}));

vi.mock('@/app/lib/chromadb', () => ({
  getChromaHealth: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn(data => data),
  },
}));

const ollamaMock = vi.mocked(getOllamaHealth);
const chromaMock = vi.mocked(getChromaHealth);

describe('Health API Route', () => {
  it('should return ok status when both services are healthy', async () => {
    ollamaMock.mockResolvedValue({ status: 'ok', models: ['model1'] });
    chromaMock.mockResolvedValue({ status: 'ok' });

    const response = await GET();
    expect(response).toEqual({
      status: 'ok',
      ollama: { status: 'ok', models: ['model1'] },
      chromadb: { status: 'ok' },
      statusCode: 200,
    });
  });

  it('should return error status when Ollama is unhealthy', async () => {
    ollamaMock.mockResolvedValue({
      status: 'error',
      message: 'Ollama not responding',
    });
    chromaMock.mockResolvedValue({ status: 'ok' });

    const response = await GET();
    expect(response).toEqual({
      status: 'error',
      ollama: { status: 'error', message: 'Ollama not responding' },
      chromadb: { status: 'ok' },
      statusCode: 503,
    });
  });

  it('should return error status when ChromaDB is unhealthy', async () => {
    ollamaMock.mockResolvedValue({ status: 'ok', models: ['model1'] });
    chromaMock.mockResolvedValue({
      status: 'error',
      message: 'ChromaDB not responding',
    });

    const response = await GET();
    expect(response).toEqual({
      status: 'error',
      ollama: { status: 'ok', models: ['model1'] },
      chromadb: { status: 'error', message: 'ChromaDB not responding' },
      statusCode: 503,
    });
  });

  it('should return error status when both services are unhealthy', async () => {
    ollamaMock.mockResolvedValue({
      status: 'error',
      message: 'Ollama not responding',
    });
    chromaMock.mockResolvedValue({
      status: 'error',
      message: 'ChromaDB not responding',
    });

    const response = await GET();
    expect(response).toEqual({
      status: 'error',
      ollama: { status: 'error', message: 'Ollama not responding' },
      chromadb: { status: 'error', message: 'ChromaDB not responding' },
      statusCode: 503,
    });
  });

  it('should return an unexpected error status on caught exception', async () => {
    ollamaMock.mockRejectedValue(new Error('Network error'));
    chromaMock.mockResolvedValue({ status: 'ok' }); // This won't be called due to Promise.all short-circuiting

    const response = await GET();
    expect(response).toEqual({
      status: 'error',
      message: 'An unexpected error occurred',
      statusCode: 500,
    });
  });
});
