export type EmbeddingOpts = {
  model: string | undefined;
  baseUrl: string | undefined;
};
export type ChromaConfig = {
  collectionName: string | undefined;
  url: string | undefined;
};

export type ChatCall = {
  model: string | undefined;
  baseUrl: string | undefined;
};

export type MemoryConfig = {
  llm: unknown;
  prompt: unknown;
  memoryKey: string;
  inputKey: string;
  outputKey: string;
  returnMessages: boolean;
  maxTokenLimit: number;
  [k: string]: unknown;
};
