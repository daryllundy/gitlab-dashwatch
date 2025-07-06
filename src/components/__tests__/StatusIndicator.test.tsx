import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import StatusIndicator from '../StatusIndicator';

describe('StatusIndicator', () => {
  it('renders healthy status correctly', () => {
    render(<StatusIndicator status="healthy" />);
    
    const indicator = screen.getByText('Healthy');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-green-600');
  });

  it('renders warning status correctly', () => {
    render(<StatusIndicator status="warning" />);
    
    const indicator = screen.getByText('Warning');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-yellow-600');
  });

  it('renders error status correctly', () => {
    render(<StatusIndicator status="error" />);
    
    const indicator = screen.getByText('Error');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-red-600');
  });

  it('renders inactive status correctly', () => {
    render(<StatusIndicator status="inactive" />);
    
    const indicator = screen.getByText('Inactive');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('text-gray-600');
  });

  it('has appropriate dot indicator for each status', () => {
    const { rerender } = render(<StatusIndicator status="healthy" />);
    expect(document.querySelector('.bg-green-500')).toBeInTheDocument();

    rerender(<StatusIndicator status="warning" />);
    expect(document.querySelector('.bg-yellow-500')).toBeInTheDocument();

    rerender(<StatusIndicator status="error" />);
    expect(document.querySelector('.bg-red-500')).toBeInTheDocument();

    rerender(<StatusIndicator status="inactive" />);
    expect(document.querySelector('.bg-gray-500')).toBeInTheDocument();
  });
});