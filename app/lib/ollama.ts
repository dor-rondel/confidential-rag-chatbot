import 'server-only';
import { OllamaHealthResponse } from './types';

/**
 * Checks the health of the Ollama server and retrieves available models.
 * 
 * @returns {Promise<OllamaHealthResponse>} A promise that resolves to an object indicating the health status and models, or an error.
 */
export async function getOllamaHealth(): Promise<OllamaHealthResponse> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      return {
        status: 'ok',
        models: data.models.map((model: any) => model.name),
      };
    }
    return { status: 'error', message: 'Ollama is not responding' };
  } catch (error) {
    return { status: 'error', message: 'Ollama is not reachable' };
  }
}
