export interface ChromaHealthResponse {
  status: 'ok' | 'error';
  message?: string;
}

export interface OllamaHealthResponse {
  status: 'ok' | 'error';
  models?: string[];
  message?: string;
}

export interface HealthApiResponse {
  status: 'ok' | 'error';
  ollama?: OllamaHealthResponse;
  chromadb?: ChromaHealthResponse;
  statusCode: number;
  message?: string;
}
