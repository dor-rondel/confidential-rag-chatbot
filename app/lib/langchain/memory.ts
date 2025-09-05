import 'server-only';
import { ConversationSummaryBufferMemory } from 'langchain/memory';
import { ChatOllama } from '@langchain/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { CUSTOM_SUMMARY_PROMPT } from './prompts';

let _memory: ConversationSummaryBufferMemory | null = null;

export function getSharedMemory(): ConversationSummaryBufferMemory {
  if (_memory) return _memory;

  const model = process.env.OLLAMA_CHAT_MODEL;
  const baseUrl = process.env.OLLAMA_BASE_URL;

  const llm = new ChatOllama({ model, baseUrl });

  _memory = new ConversationSummaryBufferMemory({
    llm,
    prompt: PromptTemplate.fromTemplate(CUSTOM_SUMMARY_PROMPT),
    memoryKey: 'chat_history',
    inputKey: 'question',
    outputKey: 'output',
    returnMessages: true,
    maxTokenLimit: 2000,
  });
  return _memory;
}

export const sharedMemory = getSharedMemory();
