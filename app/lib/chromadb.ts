import 'server-only';
import { ChromaClient } from 'chromadb';

export async function getChromaHealth() {
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
