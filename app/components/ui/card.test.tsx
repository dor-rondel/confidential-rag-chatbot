import { render, screen } from '@testing-library/react';
import { Card } from './card';
import { expect, describe, it } from 'vitest';

describe('<Card />', () => {
  it('should render with default styles', () => {
    render(<Card>Hello</Card>);
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card.className).toContain('bg-neutral-100');
  });

  it('should apply custom className', () => {
    render(<Card className='custom-class'>Hello</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('custom-class');
  });

  it('should render children', () => {
    render(
      <Card>
        <p>Child element</p>
      </Card>
    );
    expect(screen.getByText('Child element')).toBeInTheDocument();
  });
});
