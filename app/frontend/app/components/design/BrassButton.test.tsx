import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BrassButton from './BrassButton';

describe('BrassButton', () => {
  it('renders children correctly', () => {
    render(<BrassButton>Click Me</BrassButton>);
    
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    const { container } = render(<BrassButton>Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('bg-primary');
    expect(container.firstChild).toHaveClass('text-on-primary');
  });

  it('applies secondary variant when specified', () => {
    const { container } = render(<BrassButton variant="secondary">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('bg-secondary-container');
    expect(container.firstChild).toHaveClass('text-on-secondary-container');
  });

  it('applies ghost variant when specified', () => {
    const { container } = render(<BrassButton variant="ghost">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('bg-transparent');
    expect(container.firstChild).toHaveClass('text-on-surface');
  });

  it('applies outline variant when specified', () => {
    const { container } = render(<BrassButton variant="outline">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('border');
    expect(container.firstChild).toHaveClass('border-outline-variant');
  });

  it('applies medium size by default', () => {
    const { container } = render(<BrassButton>Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('px-5');
    expect(container.firstChild).toHaveClass('py-2.5');
  });

  it('applies small size when specified', () => {
    const { container } = render(<BrassButton size="sm">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('px-3');
    expect(container.firstChild).toHaveClass('py-1.5');
    expect(container.firstChild).toHaveClass('text-sm');
  });

  it('applies large size when specified', () => {
    const { container } = render(<BrassButton size="lg">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('px-6');
    expect(container.firstChild).toHaveClass('py-3');
  });

  it('is clickable when onClick is provided', () => {
    const handleClick = jest.fn();
    render(<BrassButton onClick={handleClick}>Click me</BrassButton>);
    
    fireEvent.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<BrassButton disabled onClick={handleClick}>Disabled</BrassButton>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('has correct aria-busy when loading', () => {
    render(<BrassButton loading>Loading</BrassButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('has correct aria-disabled when disabled', () => {
    render(<BrassButton disabled>Disabled</BrassButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('has correct aria-disabled when loading', () => {
    render(<BrassButton loading>Loading</BrassButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders loading spinner when loading', () => {
    render(<BrassButton loading>Loading</BrassButton>);
    
    const button = screen.getByRole('button');
    const spinner = button.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('renders icon when provided', () => {
    const icon = <svg data-testid="custom-icon" />;
    render(<BrassButton icon={icon}>With Icon</BrassButton>);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('does not render icon or spinner when not loading and no icon', () => {
    render(<BrassButton>No Icon</BrassButton>);
    
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('applies fullWidth style when specified', () => {
    const { container } = render(<BrassButton fullWidth>Full Width</BrassButton>);
    
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    const { container } = render(<BrassButton className="custom-class">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has type button by default', () => {
    render(<BrassButton>Button</BrassButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('has type submit when specified', () => {
    render(<BrassButton type="submit">Submit</BrassButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('has type reset when specified', () => {
    render(<BrassButton type="reset">Reset</BrassButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'reset');
  });

  it('has focus ring styles', () => {
    const { container } = render(<BrassButton>Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('focus:outline-none');
    expect(container.firstChild).toHaveClass('focus:ring-2');
    expect(container.firstChild).toHaveClass('focus:ring-offset-2');
  });

  it('has hover styles for primary variant', () => {
    const { container } = render(<BrassButton variant="primary">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('hover:bg-primary-container');
    expect(container.firstChild).toHaveClass('shadow-ambient');
    expect(container.firstChild).toHaveClass('hover:shadow-float');
  });

  it('has hover styles for ghost variant', () => {
    const { container } = render(<BrassButton variant="ghost">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('hover:bg-surface-container-high');
  });

  it('has hover styles for outline variant', () => {
    const { container } = render(<BrassButton variant="outline">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('hover:bg-surface-container-high');
  });

  it('renders both icon and children', () => {
    const icon = <svg data-testid="icon">Icon</svg>;
    render(<BrassButton icon={icon}>Text</BrassButton>);
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('has correct gap for medium size', () => {
    const { container } = render(<BrassButton>Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('gap-2');
  });

  it('has correct gap for small size', () => {
    const { container } = render(<BrassButton size="sm">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('gap-1.5');
  });

  it('has correct gap for large size', () => {
    const { container } = render(<BrassButton size="lg">Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('gap-2.5');
  });

  it('has font-semibold class', () => {
    const { container } = render(<BrassButton>Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('font-semibold');
  });

  it('has transition classes', () => {
    const { container } = render(<BrassButton>Button</BrassButton>);
    
    expect(container.firstChild).toHaveClass('transition-all');
    expect(container.firstChild).toHaveClass('duration-200');
  });
});
