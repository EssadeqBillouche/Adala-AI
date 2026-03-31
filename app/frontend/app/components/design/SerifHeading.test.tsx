import { render, screen } from '@testing-library/react';
import SerifHeading from './SerifHeading';

describe('SerifHeading', () => {
  it('renders children correctly', () => {
    render(<SerifHeading>Heading Text</SerifHeading>);
    
    expect(screen.getByText('Heading Text')).toBeInTheDocument();
  });

  it('renders as h2 by default', () => {
    render(<SerifHeading>Heading</SerifHeading>);
    
    expect(screen.getByText('Heading').tagName).toBe('H2');
  });

  it('renders as h1 when as is h1', () => {
    render(<SerifHeading as="h1">Heading</SerifHeading>);
    
    expect(screen.getByText('Heading').tagName).toBe('H1');
  });

  it('renders as h3 when as is h3', () => {
    render(<SerifHeading as="h3">Heading</SerifHeading>);
    
    expect(screen.getByText('Heading').tagName).toBe('H3');
  });

  it('renders as h4 when as is h4', () => {
    render(<SerifHeading as="h4">Heading</SerifHeading>);
    
    expect(screen.getByText('Heading').tagName).toBe('H4');
  });

  it('renders as h2 when level is display', () => {
    render(<SerifHeading level="display">Heading</SerifHeading>);
    
    expect(screen.getByText('Heading').tagName).toBe('H2');
  });

  it('applies font-serif class', () => {
    const { container } = render(<SerifHeading>Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('font-serif');
  });

  it('applies text-on-surface class', () => {
    const { container } = render(<SerifHeading>Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('text-on-surface');
  });

  it('applies font-semibold by default', () => {
    const { container } = render(<SerifHeading>Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('font-semibold');
  });

  it('applies font-normal when weight is normal', () => {
    const { container } = render(<SerifHeading weight="normal">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('font-normal');
  });

  it('applies font-medium when weight is medium', () => {
    const { container } = render(<SerifHeading weight="medium">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('font-medium');
  });

  it('applies font-semibold when weight is semibold', () => {
    const { container } = render(<SerifHeading weight="semibold">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('font-semibold');
  });

  it('applies medium size styles by default', () => {
    const { container } = render(<SerifHeading>Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('text-2xl');
    expect(container.firstChild).toHaveClass('md:text-3xl');
  });

  it('applies display size styles when size is display', () => {
    const { container } = render(<SerifHeading size="display">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('text-4xl');
    expect(container.firstChild).toHaveClass('md:text-5xl');
    expect(container.firstChild).toHaveClass('lg:text-6xl');
  });

  it('applies large size styles when size is lg', () => {
    const { container } = render(<SerifHeading size="lg">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('text-3xl');
    expect(container.firstChild).toHaveClass('md:text-4xl');
  });

  it('applies small size styles when size is sm', () => {
    const { container } = render(<SerifHeading size="sm">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('text-xl');
    expect(container.firstChild).toHaveClass('md:text-2xl');
  });

  it('applies h1 level styles', () => {
    const { container } = render(<SerifHeading level="h1">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('text-3xl');
    expect(container.firstChild).toHaveClass('md:text-4xl');
  });

  it('applies h2 level styles', () => {
    const { container } = render(<SerifHeading level="h2">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('text-2xl');
    expect(container.firstChild).toHaveClass('md:text-3xl');
  });

  it('applies h3 level styles', () => {
    const { container } = render(<SerifHeading level="h3">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('text-xl');
    expect(container.firstChild).toHaveClass('md:text-2xl');
  });

  it('applies h4 level styles', () => {
    const { container } = render(<SerifHeading level="h4">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('text-lg');
    expect(container.firstChild).toHaveClass('md:text-xl');
  });

  it('applies custom className', () => {
    const { container } = render(<SerifHeading className="custom-class">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders as custom element when as prop is specified', () => {
    render(<SerifHeading as="p">Heading</SerifHeading>);
    
    expect(screen.getByText('Heading').tagName).toBe('P');
  });

  it('renders as span when as prop is span', () => {
    render(<SerifHeading as="span">Heading</SerifHeading>);
    
    expect(screen.getByText('Heading').tagName).toBe('SPAN');
  });

  it('applies leading-tight for display size', () => {
    const { container } = render(<SerifHeading size="display">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('leading-tight');
    expect(container.firstChild).toHaveClass('tracking-tight');
  });

  it('applies leading-snug for large size', () => {
    const { container } = render(<SerifHeading size="lg">Heading</SerifHeading>);
    
    expect(container.firstChild).toHaveClass('leading-snug');
  });

  it('overrides as prop with level h1', () => {
    render(<SerifHeading level="h1" as="span">Heading</SerifHeading>);
    
    expect(screen.getByText('Heading').tagName).toBe('SPAN');
  });

  it('renders complex children', () => {
    render(
      <SerifHeading>
        <span>Nested</span> Content
      </SerifHeading>
    );
    
    expect(screen.getByText('Nested')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
