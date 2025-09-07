# Confidential RAG Chatbot

A privacy-first RAG chatbot that lets you upload text files and chat with them using only open-source models. All processing happens locally - your data never leaves your environment.

## Features

- Upload TXT files as knowledge bases
- Chat with your documents using open-source LLMs
- Complete privacy - no external API calls
- Local processing with Docker services
- Modern web interface built with Next.js 15

## Requirements

- Docker
- NodeJS

## Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **RAG Pipeline**: LangChain.js + Ollama embeddings
- **Vector Store**: ChromaDB
- **LLM**: Ollama (open-source models)
- **Orchestration**: Docker Compose

## Quick Start

```bash
# Start services
# Your first time running you will need to wait
# for Ollama to download the models, so get a coffee
docker compose up -d

# Make sure the models downloaded
docker compose exec ollama ollama list

# Install dependencies
pnpm i

# Run development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start chatting with your documents.

## Development

See [GEMINI.md](./GEMINI.md) for detailed development guidelines and architecture decisions.
