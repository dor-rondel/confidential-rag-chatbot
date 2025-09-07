import { sharedMemory } from '@/app/lib/langchain/memory';
import { ChatStreamOptions } from './types';

/**
 * Create an SSE (Server-Sent Events) ReadableStream for the chat response.
 * Stream protocol:
 *  - event: meta  data: {"status":"started"}
 *  - event: token data: <raw token text>
 *  - event: meta  data: {"status":"done"}
 *  - event: error data: {"status":"error","message":"..."}
 *
 * @returns ReadableStream<Uint8Array> emitting UTF-8 encoded SSE frames following the protocol above.
 */
export function createChatEventStream({
  question,
  contextText,
  latestMessage,
  chain,
}: ChatStreamOptions): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let fullResponse = '';

  return new ReadableStream<Uint8Array>({
    start(controller) {
      (async () => {
        const send = (data: string, event?: string) => {
          const payload = event
            ? `event: ${event}\ndata: ${data}\n\n`
            : `data: ${data}\n\n`;
          controller.enqueue(encoder.encode(payload));
        };
        try {
          send(JSON.stringify({ status: 'started' }), 'meta');
          const tokenStream = await chain.stream({
            question,
            context: contextText,
          });
          for await (const chunk of tokenStream as AsyncIterable<unknown>) {
            const textChunk =
              typeof chunk === 'string' ? chunk : String(chunk ?? '');
            if (textChunk === '') continue; // preserve space-only tokens
            fullResponse += textChunk;
            send(textChunk, 'token');
          }
          await sharedMemory.saveContext(
            { question: latestMessage.content },
            { output: fullResponse }
          );
          send(JSON.stringify({ status: 'done' }), 'meta');
        } catch (e: unknown) {
          const message =
            e && typeof e === 'object' && 'message' in e
              ? (e as { message?: string }).message
              : 'Stream error';
          console.error('SSE stream error:', e);
          send(JSON.stringify({ status: 'error', message }), 'error');
        } finally {
          controller.close();
        }
      })();
    },
    cancel() {
      // Client disconnected; no special cleanup required currently.
    },
  });
}
