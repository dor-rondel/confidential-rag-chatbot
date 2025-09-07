import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatCall, MemoryConfig } from './types';

const chatCalls: ChatCall[] = [];
const memoryCalls: MemoryConfig[] = [];
const promptFromTemplateSpy = vi.fn((t: string) => ({ template: t }));

vi.mock('./prompts', () => ({
  CUSTOM_SUMMARY_PROMPT: 'Extra test summary {chat_history}',
}));

vi.mock('@langchain/core/prompts', () => ({
  PromptTemplate: { fromTemplate: promptFromTemplateSpy },
}));

vi.mock('@langchain/ollama', () => ({
  ChatOllama: vi.fn(function (this: ChatCall, opts: ChatCall) {
    chatCalls.push(opts);
    this.model = opts.model;
    this.baseUrl = opts.baseUrl;
  }),
}));

vi.mock('langchain/memory', () => ({
  ConversationSummaryBufferMemory: vi.fn(function (
    this: MemoryConfig,
    config: MemoryConfig
  ) {
    memoryCalls.push(config);
    Object.assign(this, config);
  }),
}));

async function freshImport() {
  vi.resetModules();
  // After reset, mocks are retained; import module anew
  return import('./memory');
}

describe('memory.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    chatCalls.length = 0;
    memoryCalls.length = 0;
    promptFromTemplateSpy.mockClear();
    process.env.OLLAMA_CHAT_MODEL = 'phi';
    process.env.OLLAMA_BASE_URL = 'http://localhost:9000';
  });

  it('creates singleton instance only once per module load', async () => {
    const mod = await freshImport();
    const a = mod.getSharedMemory();
    const b = mod.getSharedMemory();
    expect(a).toBe(b);
    expect(chatCalls).toHaveLength(1);
    expect(memoryCalls).toHaveLength(1);
  });

  it('re-initializes after module cache reset', async () => {
    let mod = await freshImport();
    const first = mod.getSharedMemory();
    expect(memoryCalls).toHaveLength(1);
    mod = await freshImport();
    const second = mod.getSharedMemory();
    expect(memoryCalls).toHaveLength(2);
    expect(second).not.toBe(first);
  });

  it('passes empty env vars through to ChatOllama safely', async () => {
    process.env.OLLAMA_CHAT_MODEL = '';
    process.env.OLLAMA_BASE_URL = '';
    const { getSharedMemory } = await freshImport();
    getSharedMemory();
    expect(chatCalls[0]).toEqual({ model: '', baseUrl: '' });
  });

  it('configures ConversationSummaryBufferMemory with expected shape', async () => {
    const { getSharedMemory } = await freshImport();
    getSharedMemory();
    const cfg = memoryCalls[0];
    expect(cfg).toMatchObject({
      memoryKey: 'chat_history',
      inputKey: 'question',
      outputKey: 'output',
      returnMessages: true,
      maxTokenLimit: 2000,
    });
    expect(cfg.prompt).toEqual({
      template: 'Extra test summary {chat_history}',
    });
    expect(promptFromTemplateSpy).toHaveBeenCalledTimes(1);
  });

  it('does not rebuild memory or prompt on repeated getSharedMemory calls', async () => {
    const { getSharedMemory } = await freshImport();
    getSharedMemory();
    getSharedMemory();
    getSharedMemory();
    expect(memoryCalls).toHaveLength(1);
    expect(promptFromTemplateSpy).toHaveBeenCalledTimes(1);
    expect(chatCalls).toHaveLength(1);
  });

  it('reuses same llm instance inside memory config', async () => {
    const { getSharedMemory } = await freshImport();
    getSharedMemory();
    const llmRef = memoryCalls[0].llm;
    expect(llmRef).toBeTruthy();
    expect(chatCalls).toHaveLength(1);
  });
});
