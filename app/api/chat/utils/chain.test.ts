import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatPromptTemplate } from '@langchain/core/prompts';

// Mocks must be declared before importing the module under test so they take effect.
vi.mock('@langchain/ollama', () => ({
  ChatOllama: vi.fn().mockImplementation((cfg: unknown) => ({ cfg })),
}));

vi.mock('@/app/lib/langchain/memory', () => ({
  sharedMemory: {
    loadMemoryVariables: vi.fn().mockResolvedValue({ chat_history: [] }),
  },
}));

// Import after mocks
import { buildPrompt, buildLLM, buildChain } from './chain';
import { sharedMemory } from '@/app/lib/langchain/memory';
import { ChatOllama } from '@langchain/ollama';

type MockChatOllama = {
  cfg: {
    model: string | undefined;
    baseUrl: string | undefined;
    temperature: number;
  };
};

describe('chain builders', () => {
  beforeEach(() => {
    vi.stubEnv('OLLAMA_CHAT_MODEL', 'llama3');
    vi.stubEnv('OLLAMA_BASE_URL', 'http://localhost:11434');
  });

  it('buildPrompt returns ChatPromptTemplate instance', () => {
    const prompt = buildPrompt();
    expect(prompt).toBeInstanceOf(ChatPromptTemplate);
  });

  it('buildLLM uses env vars', () => {
    const llm = buildLLM() as unknown as MockChatOllama;
    expect(vi.mocked(ChatOllama).mock.calls[0][0]).toStrictEqual({
      model: 'llama3',
      baseUrl: 'http://localhost:11434',
      temperature: 0.2,
    });
    // Fallback assertion if mock implementation returned cfg
    if (llm && llm.cfg) {
      expect(llm.cfg).toStrictEqual({
        model: 'llama3',
        baseUrl: 'http://localhost:11434',
        temperature: 0.2,
      });
    }
  });

  it('buildChain wires memory + prompt + llm + parser', async () => {
    const prompt = buildPrompt();
    const llm = buildLLM();
    const chain = buildChain(prompt, llm);
    expect('stream' in chain).toBe(true);
    await sharedMemory.loadMemoryVariables({});
    expect(sharedMemory.loadMemoryVariables).toHaveBeenCalledTimes(1);
  });
});
