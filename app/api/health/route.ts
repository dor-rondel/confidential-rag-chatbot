import { NextResponse } from 'next/server';
import { getOllamaHealth } from '@/app/lib/ollama';
import { getChromaHealth } from '@/app/lib/chromadb';

export async function GET() {
  try {
    const [ollama, chromadb] = await Promise.all([
      getOllamaHealth(),
      getChromaHealth(),
    ]);

    const isHealthy = ollama.status === 'ok' && chromadb.status === 'ok';

    return NextResponse.json(
      {
        status: isHealthy ? 'ok' : 'error',
        ollama,
        chromadb,
        statusCode: isHealthy ? 200 : 503,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'An unexpected error occurred', statusCode: 500 },
    );
  }
}
