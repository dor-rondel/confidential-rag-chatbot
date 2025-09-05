import { NextRequest } from 'next/server';
import type { Message } from '@/app/lib/types';
import { sanitize } from '@/app/lib/utils';

/**
 * Generic HTTP error with status code for internal flow control.
 */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

/**
 * Parse and validate the incoming chat request.
 * @param request Next.js request
 * @throws HttpError (400) for validation issues
 *
 * @returns Parsed messages, the latest user message, and the sanitized question string.
 */
export async function readChatRequest(request: NextRequest): Promise<{
  messages: Message[];
  latestMessage: Message;
  question: string;
}> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
  if (!body || typeof body !== 'object' || !('messages' in body)) {
    throw new HttpError(400, 'Missing messages');
  }
  const messages = (body as { messages?: Message[] }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new HttpError(400, 'Missing messages');
  }
  const latestMessage = messages[messages.length - 1];
  const question = sanitize(latestMessage?.content || '').trim();
  if (!question) throw new HttpError(400, 'Empty question');
  return { messages, latestMessage, question };
}
