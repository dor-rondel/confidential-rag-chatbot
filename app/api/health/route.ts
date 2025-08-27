import { NextResponse } from 'next/server';
import { getOllamaHealth } from '@/app/lib/ollama';
import { getChromaHealth } from '@/app/lib/chromadb';
import { HealthApiResponse } from '@/app/lib/types';

/**
 * Handles GET requests to the /api/health endpoint.
 * Checks the health of Ollama and ChromaDB services.
 *
 * @returns {Promise<NextResponse<HealthApiResponse>>} A promise that resolves to a NextResponse object containing the health status of the services.
 */
export async function GET(): Promise<NextResponse<HealthApiResponse>> {
  try {
    const [ollama, chromadb] = await Promise.all([
      getOllamaHealth(),
      getChromaHealth(),
    ]);

    const isHealthy = ollama.status === 'ok' && chromadb.status === 'ok';

    return NextResponse.json<HealthApiResponse>({
      status: isHealthy ? 'ok' : 'error',
      ollama,
      chromadb,
      statusCode: isHealthy ? 200 : 503,
    });
  } catch {
    return NextResponse.json<HealthApiResponse>({
      status: 'error',
      message: 'An unexpected error occurred',
      statusCode: 500,
    });
  }
}
