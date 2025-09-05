'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Message } from '../message';
import type { Message as MessageType } from '@/app/lib/types';
import {
  appendAssistantPlaceholder,
  buildUserMessage,
  createSSEReader,
  finalizeBuffer,
  fetchChatStream,
  processSSEStream,
} from './utils';

/**
 * ChatInterface component
 *
 * Provides a client-side streaming chat UI that:
 *  1. Maintains a list of messages (assistant + user) in local state.
 *  2. Submits the conversation to the /api/chat endpoint via fetch (SSE).
 *  3. Streams assistant tokens in real time, updating a placeholder assistant message.
 *  4. Handles error and completion events, finalizing any trailing buffered data.
 *
 * State:
 *  - messages: Ordered conversation history displayed in the UI.
 *  - inputValue: Controlled text input value for the user prompt.
 *  - loading: Indicates an in-flight streaming request (disables form submission & input).
 *
 * Scrolling: Automatically scrolls to newest message when messages change.
 *
 * Streaming helpers (imported from ./utils):
 *  - buildUserMessage / appendAssistantPlaceholder (message construction)
 *  - fetchChatStream (POST + SSE Response)
 *  - createSSEReader (parses SSE frames into structured events)
 *  - processSSEStream (integrates token/error/meta events)
 *  - finalizeBuffer (handles rare trailing partial frame)
 *
 * @returns JSX.Element chat UI card with message list and input form.
 */
export function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I am an AI assistant. You can now ask me questions about your document.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMsg = buildUserMessage(messages, inputValue);
    const history = [...messages, userMsg];
    setMessages(history);
    setInputValue('');
    setLoading(true);

    const assistantId = String(history.length + 1);
    setMessages(prev => appendAssistantPlaceholder(prev, assistantId));

    try {
      const res = await fetchChatStream(history);
      const reader = createSSEReader(res.body!.getReader());
      let fullText = '';

      fullText = await processSSEStream(
        reader,
        (newContent: string) => {
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: newContent } : m)));
        },
        () => {
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: fullText } : m)));
        },
        (final: string) => {
          fullText = final;
          setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: final } : m)));
        }
      );

      // finalize any trailing buffered text (rare)
      const maybeFinal = finalizeBuffer(reader.getRemainder(), fullText);
      if (maybeFinal !== fullText) {
        fullText = maybeFinal;
        setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: fullText } : m)));
      }
    } catch (e) {
      console.error('Streaming chat error:', e);
      setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: 'Error retrieving response.' } : m)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='w-full max-w-2xl h-[70vh] flex flex-col'>
      <div className='flex-1 p-6 overflow-y-auto'>
        <div className='flex flex-col gap-4'>
          {messages.map(msg => (
            <Message key={msg.id} role={msg.role}>
              {msg.content}
            </Message>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form onSubmit={handleSubmit} className='p-4 border-t border-neutral-200'>
        <div className='flex items-center gap-2'>
          <Input
            type='text'
            placeholder='Type your message...'
            className='flex-1'
            value={inputValue}
            onChange={handleInputChange}
            disabled={loading}
          />
          <Button type='submit' disabled={loading}>
            {loading ? '...' : 'Send'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
