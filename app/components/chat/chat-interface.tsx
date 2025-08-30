'use client';

import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Message } from './message';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * The main chat interface component.
 * It includes the chat history, a message input field, and a send button.
 *
 * @returns {JSX.Element} The chat interface component.
 */
export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am an AI assistant. You can now ask me questions about your document.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inputValue.trim()) {
      setMessages([...messages, { role: 'user', content: inputValue.trim() }]);
      setInputValue('');
    }
  };

  return (
    <Card className="w-full max-w-2xl h-[70vh] flex flex-col">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <Message key={index} role={msg.role}>
              {msg.content}
            </Message>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-200">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            className="flex-1"
            value={inputValue}
            onChange={handleInputChange}
          />
          <Button type="submit">Send</Button>
        </div>
      </form>
    </Card>
  );
}
