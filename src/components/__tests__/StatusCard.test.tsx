import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { Gitlab } from 'lucide-react';
import StatusCard from '../StatusCard';

describe('StatusCard', () => {
  it('renders with basic props', () => {
    render(
      <StatusCard
        title="Test Card"
        status="healthy"
      />
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('displays icon when provided', () => {
    render(
      <StatusCard
        title="Test Card"
        status="healthy"
        icon={Gitlab}
      />
    );

    // Check that icon is rendered (Lucide icons render as SVG)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('displays subtitle when provided', () => {
    render(
      <StatusCard
        title="Test Card"
        status="healthy"
        subtitle="Test subtitle"
      />
    );

    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('displays animated number when value is provided', () => {
    render(
      <StatusCard
        title="Test Card"
        status="healthy"
        value={42}
        unit="items"
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('items')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <StatusCard
        title="Test Card"
        status="healthy"
      >
        <div>Child content</div>
      </StatusCard>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('calls onClick when clicked and cursor is pointer', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <StatusCard
        title="Test Card"
        status="healthy"
        onClick={handleClick}
      />
    );

    const card = screen.getByText('Test Card').closest('div');
    expect(card).toHaveClass('cursor-pointer');

    await user.click(card!);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    render(
      <StatusCard
        title="Test Card"
        status="healthy"
        className="custom-class"
      />
    );

    const card = screen.getByText('Test Card').closest('div');
    expect(card).toHaveClass('custom-class');
  });

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' };
    
    render(
      <StatusCard
        title="Test Card"
        status="healthy"
        style={customStyle}
      />
    );

    const card = screen.getByText('Test Card').closest('div');
    expect(card).toHaveStyle('background-color: red');
  });
});