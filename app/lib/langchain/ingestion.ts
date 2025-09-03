import 'server-only';

import { OllamaEmbeddings } from '@langchain/ollama';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';

// 1. Configure Ollama Embeddings
const embeddings = new OllamaEmbeddings({
  model: 'nomic-embed-text',
  baseUrl: 'http://localhost:11434',
});

// 2. Configure the Text Splitter
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000, // Max chunk size in characters
  chunkOverlap: 200, // Overlap between chunks
});

// 3. Define the name for our ChromaDB collection
const CHROMA_COLLECTION_NAME = 'rag-collection';

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
      collectionName: CHROMA_COLLECTION_NAME,
      url: 'http://localhost:8000', // Ensure this matches your docker-compose setup
    });

    console.log(
      `Successfully ingested ${chunks.length} chunks from ${file.name}.`
    );
  } catch (error) {
    console.error('Ingestion failed:', error);
    throw new Error('Failed to ingest document. Please check the logs.');
  }
}
