import { render, screen } from '@testing-library/react';
import Label from './Label';

describe('Label', () => {
  it('renders children correctly', () => {
    render(<Label>Label Text</Label>);
    
    expect(screen.getByText('Label Text')).toBeInTheDocument();
  });

  it('renders as span by default', () => {
    render(<Label>Label</Label>);
    
    expect(screen.getByText('Label').tagName).toBe('SPAN');
  });

  it('renders as p when as is p', () => {
    render(<Label as="p">Label</Label>);
    
    expect(screen.getByText('Label').tagName).toBe('P');
  });

  it('renders as label when as is label', () => {
    render(<Label as="label">Label</Label>);
    
    expect(screen.getByText('Label').tagName).toBe('LABEL');
  });

  it('renders as div when as is div', () => {
    render(<Label as="div">Label</Label>);
    
    expect(screen.getByText('Label').tagName).toBe('DIV');
  });

  it('applies base styles', () => {
    const { container } = render(<Label>Label</Label>);
    
    expect(container.firstChild).toHaveClass('font-semibold');
    expect(container.firstChild).toHaveClass('uppercase');
    expect(container.firstChild).toHaveClass('tracking-widest');
    expect(container.firstChild).toHaveClass('font-sans');
  });

  it('applies xs size by default', () => {
    const { container } = render(<Label>Label</Label>);
    
    expect(container.firstChild).toHaveClass('text-[0.65rem]');
  });

  it('applies sm size when specified', () => {
    const { container } = render(<Label size="sm">Label</Label>);
    
    expect(container.firstChild).toHaveClass('text-xs');
  });

  it('applies default variant by default', () => {
    const { container } = render(<Label>Label</Label>);
    
    expect(container.firstChild).toHaveClass('text-on-surface');
  });

  it('applies secondary variant when specified', () => {
    const { container } = render(<Label variant="secondary">Label</Label>);
    
    expect(container.firstChild).toHaveClass('text-secondary');
  });

  it('applies muted variant when specified', () => {
    const { container } = render(<Label variant="muted">Label</Label>);
    
    expect(container.firstChild).toHaveClass('text-gray-400');
  });

  it('applies primary variant when specified', () => {
    const { container } = render(<Label variant="primary">Label</Label>);
    
    expect(container.firstChild).toHaveClass('text-primary');
  });

  it('applies custom className', () => {
    const { container } = render(<Label className="custom-class">Label</Label>);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders complex children', () => {
    render(
      <Label>
        <span>Nested</span> Content
      </Label>
    );
    
    expect(screen.getByText('Nested')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
