import { buildChain } from './chain';
import type { Message } from '@/app/lib/types';

export type StreamRunnable = {
  stream: (input: {
    question: string;
    context: string;
  }) => AsyncIterable<unknown> | Promise<AsyncIterable<unknown>>;
};

export type ChatStreamOptions = {
  question: string;
  contextText: string;
  latestMessage: Message;
  chain: StreamRunnable | ReturnType<typeof buildChain>;
};

export type RetrieverLike = {
  invoke: (q: string) => Promise<{ pageContent: string }[]>;
};
