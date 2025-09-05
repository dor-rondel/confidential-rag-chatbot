import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { ChatOllama } from '@langchain/ollama';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { sharedMemory } from '@/app/lib/langchain/memory';
import { SYSTEM_PROMPT } from '@/app/lib/langchain/prompts';

/**
 * Build the system/user prompt template chain.
 *
 * @returns ChatPromptTemplate configured with system prompt, chat history placeholder, and user question.
 */
export function buildPrompt(): ChatPromptTemplate {
  return ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(SYSTEM_PROMPT),
    new MessagesPlaceholder('chat_history'),
    HumanMessagePromptTemplate.fromTemplate('{question}'),
  ]);
}

/**
 * Construct the underlying LLM (Ollama chat model) instance.
 *
 * @returns Configured ChatOllama instance for streaming responses.
 */
export function buildLLM(): ChatOllama {
  return new ChatOllama({
    model: process.env.OLLAMA_CHAT_MODEL,
    baseUrl: process.env.OLLAMA_BASE_URL,
    temperature: 0.2,
  });
}

/**
 * Build the full runnable chain: input mapping -> prompt -> LLM -> string output.
 *
 * @returns RunnableSequence that accepts { question, context } and yields streamed string tokens.
 */
export function buildChain(prompt: ChatPromptTemplate, llm: ChatOllama) {
  return RunnableSequence.from([
    {
      question: (input: { question: string; context: string }) =>
        input.question,
      context: (input: { question: string; context: string }) => input.context,
      chat_history: async () => {
        const memory = await sharedMemory.loadMemoryVariables({});
        return memory.chat_history;
      },
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);
}
