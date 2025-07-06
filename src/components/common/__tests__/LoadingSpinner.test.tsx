import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner without text', () => {
    render(<LoadingSpinner />);
    
    // Check for the spinning icon (Lucide Loader2)
    expect(document.querySelector('svg')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders spinner with text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(document.querySelector('.h-4.w-4')).toBeInTheDocument();

    rerender(<LoadingSpinner size="md" />);
    expect(document.querySelector('.h-6.w-6')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(document.querySelector('.h-8.w-8')).toBeInTheDocument();
  });

  it('uses medium size by default', () => {
    render(<LoadingSpinner />);
    
    expect(document.querySelector('.h-6.w-6')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    
    const container = document.querySelector('.custom-spinner');
    expect(container).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner text="Loading..." />);
    
    const textElement = screen.getByText('Loading...');
    expect(textElement).toHaveClass('text-muted-foreground');
  });
});