import { render, screen, fireEvent } from '@testing-library/react';
import TonalCard from './TonalCard';

describe('TonalCard', () => {
  it('renders children correctly', () => {
    render(<TonalCard>Test Content</TonalCard>);
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    const { container } = render(<TonalCard>Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('bg-surface-container-lowest');
    expect(container.firstChild).toHaveClass('shadow-ambient');
  });

  it('applies tonal variant when specified', () => {
    const { container } = render(<TonalCard variant="tonal">Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('bg-surface-container-low');
  });

  it('applies elevated variant when specified', () => {
    const { container } = render(<TonalCard variant="elevated">Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('bg-surface-container-lowest');
    expect(container.firstChild).toHaveClass('shadow-float');
  });

  it('applies primary variant when specified', () => {
    const { container } = render(<TonalCard variant="primary">Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('bg-primary');
    expect(container.firstChild).toHaveClass('text-on-primary');
  });

  it('applies secondary variant when specified', () => {
    const { container } = render(<TonalCard variant="secondary">Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('bg-secondary-container');
    expect(container.firstChild).toHaveClass('text-on-secondary-container');
  });

  it('applies hover styles when hover and onClick are provided', () => {
    const { container } = render(<TonalCard onClick={() => {}}>Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('hover:bg-surface-container-highest');
    expect(container.firstChild).toHaveClass('hover:shadow-float');
    expect(container.firstChild).toHaveClass('hover:-translate-y-0.5');
  });

  it('does not apply hover styles when hover is false', () => {
    const { container } = render(
      <TonalCard hover={false} onClick={() => {}}>Content</TonalCard>
    );
    
    expect(container.firstChild).not.toHaveClass('hover:bg-surface-container-highest');
  });

  it('is clickable when onClick is provided', () => {
    const handleClick = jest.fn();
    render(<TonalCard onClick={handleClick}>Click me</TonalCard>);
    
    fireEvent.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is not clickable when onClick is not provided', () => {
    render(<TonalCard>Not clickable</TonalCard>);
    
    expect(screen.getByText('Not clickable')).not.toHaveAttribute('role');
  });

  it('has button role when clickable', () => {
    render(<TonalCard onClick={() => {}}>Clickable</TonalCard>);
    
    expect(screen.getByText('Clickable')).toHaveAttribute('role', 'button');
  });

  it('has tabIndex when clickable', () => {
    render(<TonalCard onClick={() => {}}>Clickable</TonalCard>);
    
    expect(screen.getByText('Clickable')).toHaveAttribute('tabIndex', '0');
  });

  it('does not have tabIndex when not clickable', () => {
    render(<TonalCard>Not clickable</TonalCard>);
    
    expect(screen.getByText('Not clickable')).not.toHaveAttribute('tabIndex');
  });

  it('applies custom className', () => {
    const { container } = render(<TonalCard className="custom-class">Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies medium padding by default', () => {
    const { container } = render(<TonalCard>Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('applies small padding when specified', () => {
    const { container } = render(<TonalCard padding="sm">Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('p-4');
  });

  it('applies large padding when specified', () => {
    const { container } = render(<TonalCard padding="lg">Content</TonalCard>);
    
    expect(container.firstChild).toHaveClass('p-8');
  });

  it('applies no padding when specified', () => {
    const { container } = render(<TonalCard padding="none">Content</TonalCard>);
    
    expect(container.firstChild).not.toHaveClass('p-4');
    expect(container.firstChild).not.toHaveClass('p-6');
    expect(container.firstChild).not.toHaveClass('p-8');
  });

  it('handles keyboard interaction with Enter key', () => {
    const handleClick = jest.fn();
    render(<TonalCard onClick={handleClick}>Keyboard clickable</TonalCard>);
    
    fireEvent.keyDown(screen.getByText('Keyboard clickable'), { key: 'Enter' });
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('has aria-label when clickable', () => {
    render(<TonalCard onClick={() => {}}>Accessible</TonalCard>);
    
    expect(screen.getByText('Accessible')).toHaveAttribute('aria-label', 'Interactive card');
  });

  it('does not have aria-label when not clickable', () => {
    render(<TonalCard>Not accessible</TonalCard>);
    
    expect(screen.getByText('Not accessible')).not.toHaveAttribute('aria-label');
  });
});
