import { render, screen } from '@testing-library/react';
import { Message } from './message';
import { expect, describe, it } from 'vitest';

describe('<Message />', () => {
  it('should render a user message with correct styles', () => {
    render(<Message role='user'>Hello</Message>);
    const message = screen.getByTestId('message');
    expect(message).toBeInTheDocument();
    expect(message.className).toContain('bg-primary-500');
    expect(message.className).toContain('self-end');
  });

  it('should render an assistant message with correct styles', () => {
    render(<Message role='assistant'>Hi there</Message>);
    const message = screen.getByTestId('message');
    expect(message).toBeInTheDocument();
    expect(message.className).toContain('bg-neutral-200');
    expect(message.className).toContain('self-start');
  });

  it('should render children', () => {
    render(
      <Message role='user'>
        <p>Child element</p>
      </Message>
    );
    expect(screen.getByText('Child element')).toBeInTheDocument();
  });
});
