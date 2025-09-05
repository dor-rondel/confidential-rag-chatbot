import 'server-only';

import { OllamaEmbeddings } from '@langchain/ollama';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // Max chunk size in characters
  chunkOverlap: 200, // Overlap between chunks
});

/**
 * Processes an uploaded text file, splits it into chunks,
 * generates embeddings, and stores them in a ChromaDB vector store.
 *
 * @param {File} file - The text file to ingest.
 *
 * @returns {Promise<void>}
 * @throws {Error} If the ingestion process fails.
 */
export async function ingestDocument(file: File): Promise<void> {
  try {
    const embedModel = process.env.OLLAMA_EMBED_MODEL;
    const baseUrl = process.env.OLLAMA_BASE_URL;
    const collectionName = process.env.CHROMA_COLLECTION_NAME;
    const chromaUrl = process.env.CHROMA_URL;

    if (!embedModel) throw new Error('Missing OLLAMA_EMBED_MODEL env var');
    if (!baseUrl) throw new Error('Missing OLLAMA_BASE_URL env var');
    if (!collectionName)
      throw new Error('Missing CHROMA_COLLECTION_NAME env var');
    if (!chromaUrl) throw new Error('Missing CHROMA_URL env var');

    // Instantiate embeddings per invocation so tests picking env vars dynamically work.
    const embeddings = new OllamaEmbeddings({
      model: embedModel,
      baseUrl,
    });

    // Load the document's content
    const text = await file.text();
    const docs = [
      new Document({
        pageContent: text,
        metadata: { name: file.name, type: file.type, size: file.size },
      }),
    ];

    // Split the document into chunks
    const chunks = await textSplitter.splitDocuments(docs);

    // Embed the chunks and store them in ChromaDB. The Chroma.fromDocuments
    // method handles creating the collection if it doesn't exist.
    await Chroma.fromDocuments(chunks, embeddings, {
      collectionName,
      url: chromaUrl,
    });

    console.log(
      `Successfully ingested ${chunks.length} chunks from ${file.name}.`
    );
  } catch (error) {
    console.error('Ingestion failed:', error);
    throw new Error('Failed to ingest document. Please check the logs.');
  }
}
