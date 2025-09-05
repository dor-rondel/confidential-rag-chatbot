import 'server-only';

import { OllamaEmbeddings } from '@langchain/ollama';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import type { BaseRetriever } from '@langchain/core/retrievers';

/**
 * Creates and returns a retriever for the ChromaDB vector store.
 */
export async function getVectorStoreRetriever(): Promise<BaseRetriever> {
  const embeddings = new OllamaEmbeddings({
    model: process.env.OLLAMA_EMBED_MODEL,
    baseUrl: process.env.OLLAMA_BASE_URL,
  });

  const vectorStore = new Chroma(embeddings, {
    collectionName: process.env.CHROMA_COLLECTION_NAME,
    url: process.env.CHROMA_URL,
  });

  return vectorStore.asRetriever();
}
