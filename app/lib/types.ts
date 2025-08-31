export type ChromaHealthResponse = {
  status: 'ok' | 'error';
  message?: string;
};

export type OllamaHealthResponse = {
  status: 'ok' | 'error';
  models?: string[];
  message?: string;
};

export type HealthApiResponse = {
  status: 'ok' | 'error';
  ollama?: OllamaHealthResponse;
  chromadb?: ChromaHealthResponse;
  statusCode: number;
  message?: string;
};
