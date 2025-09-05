import 'server-only';
import { ChromaClient } from 'chromadb';

let _client: ChromaClient | null = null;
export function getChromaClient(): ChromaClient {
  if (_client) return _client;
  _client = new ChromaClient();
  return _client;
}
