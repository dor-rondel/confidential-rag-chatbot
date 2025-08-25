import 'server-only';
import { ChromaClient } from 'chromadb';
import { ChromaHealthResponse } from './types';

/**
 * Checks the health of the ChromaDB server.
 * 
 * @returns {Promise<ChromaHealthResponse>} A promise that resolves to an object indicating the health status.
 */
export async function getChromaHealth(): Promise<ChromaHealthResponse> {
  const client = new ChromaClient();
  try {
    const isAlive = await client.heartbeat();
    if (isAlive) {
      return { status: 'ok' };
    }
    return { status: 'error', message: 'ChromaDB is not responding' };
  } catch (error) {
    return { status: 'error', message: 'ChromaDB is not reachable' };
  }
}
