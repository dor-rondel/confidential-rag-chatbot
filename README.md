# Confidential RAG Chatbot

A privacy-first RAG chatbot that lets you upload text files and chat with them using only open-source models. All processing happens locally - your data never leaves your environment.

## Features

- Upload TXT files as knowledge bases
- Chat with your documents using open-source LLMs
- Complete privacy - no external API calls
- Local processing with Docker services
- Modern web interface built with Next.js 15

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **RAG Pipeline**: LangChain.js + HuggingFace embeddings
- **Vector Store**: ChromaDB
- **LLM**: Ollama (open-source models)
- **Orchestration**: Docker Compose

## Quick Start

```bash
# Start services
docker compose up -d

# Install dependencies
pnpm i

# Run development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting with your documents.

## Development

See [GEMINI.md](./GEMINI.md) for detailed development guidelines and architecture decisions.
