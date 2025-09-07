import type { Message as MessageType } from '@/app/lib/types';

/**
 * Construct a new user message object given existing messages and raw input.
 * @param existing Current ordered chat messages
 * @param input Raw user input text (may contain surrounding whitespace)
 *
 * @returns New user Message whose id is (existing.length + 1) and trimmed content
 */
export function buildUserMessage(
  existing: MessageType[],
  input: string
): MessageType {
  return {
    id: String(existing.length + 1),
    role: 'user',
    content: input.trim(),
  };
}

/**
 * Append a placeholder assistant message (empty content) used while streaming tokens.
 * @param existing Current messages
 * @param assistantId The deterministic id to assign (e.g. String(existing.length + 2))
 *
 * @returns A new messages array including the assistant placeholder
 */
export function appendAssistantPlaceholder(
  existing: MessageType[],
  assistantId: string
): MessageType[] {
  return [...existing, { id: assistantId, role: 'assistant', content: '' }];
}

export type SSETokenEvent = { type: 'token'; data: string };
export type SSErrorEvent = {
  type: 'error';
  data: { status: string; message: string };
};
export type SSEMetaEvent = { type: 'meta'; data: { status: string } };
export type SSEEvent = SSETokenEvent | SSErrorEvent | SSEMetaEvent;

/**
 * Create an async-iterable SSE reader around a ReadableStreamDefaultReader.
 * Accumulates bytes, splits SSE frames on double newlines ("\n\n"), and
 * yields structured events (token | error | meta). Maintains an internal
 * remainder buffer for partially received frames.
 *
 * Expected SSE frame format:
 *   event: <eventType>\n
 *   data: <JSON or raw token>\n
 *   \n
 * Unknown / malformed events are ignored. Malformed JSON in error/meta events is handled gracefully.
 *
 * @param reader The underlying stream reader for UTF-8 encoded SSE bytes
 *
 * @returns AsyncGenerator of SSEEvent with an extra helper getRemainder()
 */
export function createSSEReader(
  reader: ReadableStreamDefaultReader<Uint8Array>
) {
  let buffer = '';

  function parseFrame(rawEvent: string) {
    const lines = rawEvent.split('\n');
    let eventType: string | undefined;
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('event:')) eventType = line.slice(6).trim();
      else if (line.startsWith('data:')) {
        let v = line.slice(5); // keeps possible leading space
        if (v.startsWith(' ')) v = v.slice(1); // trim single leading space (tests expect)
        dataLines.push(v);
      }
    }
    const dataRaw = dataLines.join('\n');
    return { eventType, dataRaw };
  }

  async function* stream(): AsyncGenerator<SSEEvent, void, unknown> {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sepIndex: number;
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        const { eventType, dataRaw } = parseFrame(rawEvent);
        if (!dataRaw) continue;
        if (eventType === 'token') {
          yield { type: 'token', data: dataRaw } as SSETokenEvent;
        } else if (eventType === 'error') {
          try {
            const parsed = JSON.parse(dataRaw);
            yield { type: 'error', data: parsed } as SSErrorEvent;
          } catch {
            yield {
              type: 'error',
              data: { status: 'error', message: 'Unknown error' },
            } as SSErrorEvent;
          }
        } else if (eventType === 'meta') {
          try {
            const meta = JSON.parse(dataRaw);
            yield { type: 'meta', data: meta } as SSEMetaEvent;
          } catch {
            // ignore malformed meta
          }
        }
      }
    }
    // End of stream: attempt to parse a trailing partial frame (no terminating blank line)
    if (buffer.includes('event:') && buffer.includes('data:')) {
      const snapshot = buffer; // retain remainder per tests
      const { eventType, dataRaw } = parseFrame(snapshot);
      if (dataRaw) {
        if (eventType === 'token') {
          yield { type: 'token', data: dataRaw } as SSETokenEvent;
        } else if (eventType === 'error') {
          try {
            const parsed = JSON.parse(dataRaw);
            yield { type: 'error', data: parsed } as SSErrorEvent;
          } catch {
            yield {
              type: 'error',
              data: { status: 'error', message: 'Unknown error' },
            } as SSErrorEvent;
          }
        } else if (eventType === 'meta') {
          try {
            const meta = JSON.parse(dataRaw);
            yield { type: 'meta', data: meta } as SSEMetaEvent;
          } catch {
            // ignore malformed meta
          }
        }
      }
      // do NOT clear buffer so getRemainder() exposes raw partial frame
    }
  }

  return Object.assign(stream(), {
    getRemainder: () => buffer,
  });
}

/**
 * Integrate a token chunk into the accumulating assistant output.
 * @param chunk Newly received token text
 * @param current Current accumulated text
 * @param update Side-effect callback to propagate new text to UI state
 *
 * @returns The new accumulated text value
 */
export function integrateChunkEvent(
  chunk: string,
  current: string,
  update: (text: string) => void
): string {
  const next = current + chunk;
  update(next);
  return next;
}

/**
 * Merge any leftover partial frame remainder with the accumulated text.
 * @param remainder Unconsumed buffered string from SSE parsing
 * @param current Current accumulated text
 *
 * @returns Final combined text
 */
export function finalizeBuffer(remainder: string, current: string): string {
  if (!remainder) return current;
  return current + remainder;
}

/**
 * Perform a POST request to the chat API returning an SSE stream response.
 * @param messages Current full conversation messages
 *
 * @throws Error if the network response is not ok or has no body
 * @returns Fetch Response whose body is an SSE ReadableStream
 */
export async function fetchChatStream(
  messages: MessageType[]
): Promise<Response> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok || !res.body) throw new Error('Network error');
  return res;
}

/**
 * Consume the SSE reader, invoking callbacks for token, error, and done events.
 * Appends received token chunks into a single aggregated assistant response.
 *
 * Error events append a human-readable marker ("\n[Error]\n") to the final text.
 *
 * @param reader Async generator returned by createSSEReader
 * @param onToken Callback fired with the updated full text after each token
 * @param onError Callback fired once upon first error event
 * @param onDone Callback fired with the final full text when a meta:done arrives
 *
 * @returns The final accumulated text after the stream ends
 */
export async function processSSEStream(
  reader: ReturnType<typeof createSSEReader>,
  onToken: (text: string) => void,
  onError: () => void,
  onDone: (final: string) => void
) {
  let fullText = '';
  for await (const evt of reader) {
    if (evt.type === 'token') {
      fullText = integrateChunkEvent(evt.data, fullText, onToken);
    } else if (evt.type === 'error') {
      fullText += '\n[Error]\n';
      onError();
    } else if (evt.type === 'meta' && evt.data.status === 'done') {
      onDone(fullText);
    }
  }
  return fullText;
}
