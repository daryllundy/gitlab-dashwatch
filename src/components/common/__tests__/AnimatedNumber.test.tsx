import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import AnimatedNumber from '../AnimatedNumber';

// Mock requestAnimationFrame for testing
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

describe('AnimatedNumber', () => {
  it('renders the component with initial value', () => {
    render(<AnimatedNumber value={42} duration={0} />);
    
    // With duration 0, it should show the final value immediately
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('handles zero value', () => {
    render(<AnimatedNumber value={0} duration={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles negative values', () => {
    render(<AnimatedNumber value={-5} duration={0} />);
    
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('handles large numbers', () => {
    render(<AnimatedNumber value={1000000} duration={0} />);
    
    expect(screen.getByText('1000000')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AnimatedNumber value={42} className="custom-class" duration={0} />);
    
    const element = screen.getByText('42');
    expect(element).toHaveClass('custom-class');
  });

  it('has default animation classes', () => {
    render(<AnimatedNumber value={42} duration={0} />);
    
    const element = screen.getByText('42');
    expect(element).toHaveClass('inline-block');
    expect(element).toHaveClass('transition-transform');
    expect(element).toHaveClass('animate-count-up');
  });

  it('animates from 0 to target value', async () => {
    render(<AnimatedNumber value={100} duration={100} />);
    
    // Initially should show 0
    expect(screen.getByText('0')).toBeInTheDocument();
    
    // After animation completes, should show target value
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    }, { timeout: 200 });
  });
});
