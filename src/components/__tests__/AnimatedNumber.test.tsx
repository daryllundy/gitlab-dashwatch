import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import AnimatedNumber from '../AnimatedNumber';

describe('AnimatedNumber', () => {
  it('renders the number value', () => {
    render(<AnimatedNumber value={42} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('handles zero value', () => {
    render(<AnimatedNumber value={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles negative values', () => {
    render(<AnimatedNumber value={-5} />);
    
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('handles large numbers', () => {
    render(<AnimatedNumber value={1000000} />);
    
    expect(screen.getByText('1000000')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AnimatedNumber value={42} className="custom-class" />);
    
    const element = screen.getByText('42');
    expect(element).toHaveClass('custom-class');
  });

  it('has default tabular-nums class', () => {
    render(<AnimatedNumber value={42} />);
    
    const element = screen.getByText('42');
    expect(element).toHaveClass('tabular-nums');
  });
});