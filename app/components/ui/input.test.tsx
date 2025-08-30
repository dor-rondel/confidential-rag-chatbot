import { render, screen } from '@testing-library/react';
import { Input } from './input';
import { expect, vi, describe, it } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('<Input />', () => {
  it('should render with default styles', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input.className).toContain('border-neutral-300');
  });

  it('should apply custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-class');
  });

  it('should handle change events', async () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Hello');
    expect(handleChange).toHaveBeenCalledTimes(5);
  });

  it('should have a placeholder', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });
});
