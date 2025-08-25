import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import StatusIndicator from '../StatusIndicator';

describe('StatusIndicator', () => {
  it('renders healthy status dot correctly', () => {
    render(<StatusIndicator status="healthy" />);
    
    const indicator = screen.getByLabelText('Status: healthy');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-success');
  });

  it('renders warning status dot correctly', () => {
    render(<StatusIndicator status="warning" />);
    
    const indicator = screen.getByLabelText('Status: warning');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-warning');
  });

  it('renders error status dot correctly', () => {
    render(<StatusIndicator status="error" />);
    
    const indicator = screen.getByLabelText('Status: error');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-destructive');
  });

  it('renders inactive status dot correctly', () => {
    render(<StatusIndicator status="inactive" />);
    
    const indicator = screen.getByLabelText('Status: inactive');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('bg-muted');
  });

  it('renders with label when provided', () => {
    render(<StatusIndicator status="healthy" label="System Online" />);
    
    expect(screen.getByText('System Online')).toBeInTheDocument();
    expect(screen.getByLabelText('Status: healthy')).toBeInTheDocument();
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<StatusIndicator status="healthy" size="sm" />);
    expect(screen.getByLabelText('Status: healthy')).toHaveClass('w-2', 'h-2');

    rerender(<StatusIndicator status="healthy" size="md" />);
    expect(screen.getByLabelText('Status: healthy')).toHaveClass('w-3', 'h-3');

    rerender(<StatusIndicator status="healthy" size="lg" />);
    expect(screen.getByLabelText('Status: healthy')).toHaveClass('w-4', 'h-4');
  });

  it('applies pulse animation when enabled', () => {
    render(<StatusIndicator status="healthy" pulse={true} />);
    
    const indicator = screen.getByLabelText('Status: healthy');
    expect(indicator).toHaveClass('animate-pulse-opacity');
  });

  it('does not apply pulse animation for inactive status', () => {
    render(<StatusIndicator status="inactive" pulse={true} />);
    
    const indicator = screen.getByLabelText('Status: inactive');
    expect(indicator).not.toHaveClass('animate-pulse-opacity');
  });
});
