import { NextRequest } from 'next/server';
import { HttpError, readChatRequest } from './utils/request';
import { retrieveContext } from './utils/retrieval';
import { buildPrompt, buildLLM, buildChain } from './utils/chain';
import { createChatEventStream } from './utils/stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 * Orchestrates: request parsing -> context retrieval -> chain setup -> SSE streaming.
 */
export async function POST(request: NextRequest) {
  try {
    const { latestMessage, question } = await readChatRequest(request);
    const { contextText } = await retrieveContext(question);
    const prompt = buildPrompt();
    const llm = buildLLM();
    const chain = buildChain(prompt, llm);
    const stream = createChatEventStream({
      question,
      contextText,
      latestMessage,
      chain,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Connection: 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return new Response(err.message, { status: err.status });
    }
    console.error('Chat route error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
