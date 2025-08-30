
import { render, screen } from '@testing-library/react';
import { ChatInterface } from './chat-interface';
import { expect, describe, it } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('ChatInterface', () => {
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
});
