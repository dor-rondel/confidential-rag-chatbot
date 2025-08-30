
import { render, screen } from '@testing-library/react';
import { Button } from './button';
import { expect, vi, describe, it } from 'vitest';

describe('Button', () => {
  it('should render with default styles', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain('bg-primary-500');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button.className).toContain('custom-class');
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
