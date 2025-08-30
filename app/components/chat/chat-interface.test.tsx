import { render, screen } from '@testing-library/react';
import { ChatInterface } from './chat-interface';
import { expect, describe, it, vi, beforeAll } from 'vitest';
import userEvent from '@testing-library/user-event';

const scrollIntoViewMock = vi.fn();

describe('ChatInterface', () => {
  beforeAll(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      value: scrollIntoViewMock,
      writable: true,
      configurable: true,
    });
  });

  it('should render the initial assistant message', () => {
    render(<ChatInterface />);
    expect(screen.getByText(/Hello! I am an AI assistant./)).toBeInTheDocument();
  });

  it('should add a new user message on submit', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'Hello, world!');
    await userEvent.click(sendButton);

    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('should clear the input after submitting', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'This should clear');
    await userEvent.click(sendButton);

    expect(input).toHaveValue('');
  });

  it('should scroll to the bottom when a new message is added', async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await userEvent.type(input, 'New message');
    await userEvent.click(sendButton);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
