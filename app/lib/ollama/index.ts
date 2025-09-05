import 'server-only';
import { ChatOllama } from '@langchain/ollama';
import type { OllamaHealthResponse } from '../types';

export const llm = new ChatOllama({
  model: process.env.OLLAMA_CHAT_MODEL,
  baseUrl: process.env.OLLAMA_BASE_URL,
});

export async function getOllamaHealth(): Promise<OllamaHealthResponse> {
  try {
    const response = await fetch(`${process.env.OLLAMA_BASE_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      return {
        status: 'ok',
        models: (data.models || []).map((m: { name: string }) => m.name),
      };
    }
    return { status: 'error', message: 'Ollama is not responding' };
  } catch {
    return { status: 'error', message: 'Ollama is not reachable' };
  }
}
