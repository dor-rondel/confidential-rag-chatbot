import 'server-only';
import type { ChromaHealthResponse } from '../types';
import { getChromaClient } from './client';

export async function getChromaHealth(): Promise<ChromaHealthResponse> {
  const client = getChromaClient();
  try {
    const isAlive = await client.heartbeat();
    if (isAlive) return { status: 'ok' };
    return { status: 'error', message: 'ChromaDB is not responding' };
  } catch {
    return { status: 'error', message: 'ChromaDB is not reachable' };
  }
}
