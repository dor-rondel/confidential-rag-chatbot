import { getVectorStoreRetriever } from '@/app/lib/langchain/retrieval';

/**
 * Retrieve relevant documents for a question using the vector store retriever.
 * Uses the new retriever.invoke() API (getRelevantDocuments is deprecated).
 * @param question Sanitized user question.
 *
 * @returns Promise resolving to an object containing the retrieved documents array
 *          and a merged contextText string (joined with double newlines) used
 *          for downstream prompting.
 */
export async function retrieveContext(question: string): Promise<{
  documents: { pageContent: string }[];
  contextText: string;
}> {
  const retriever = await getVectorStoreRetriever();
  const documents = await retriever.invoke(question);
  const contextText = documents
    .map((d: { pageContent: string }) => d.pageContent)
    .join('\n\n');
  return { documents, contextText };
}
