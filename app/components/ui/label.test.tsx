import { render, screen } from '@testing-library/react';
import { Label } from './label';
import { expect, describe, it } from 'vitest';

describe('<Label />', () => {
  it('should render with default styles', () => {
    render(<Label>Hello</Label>);
    const label = screen.getByText('Hello');
    expect(label).toBeInTheDocument();
    expect(label.className).toContain('text-neutral-700');
  });

  it('should apply custom className', () => {
    render(<Label className="custom-class">Hello</Label>);
    const label = screen.getByText('Hello');
    expect(label.className).toContain('custom-class');
  });

  it('should render children', () => {
    render(
      <Label>
        <span>Child element</span>
      </Label>,
    );
    expect(screen.getByText('Child element')).toBeInTheDocument();
  });
});
