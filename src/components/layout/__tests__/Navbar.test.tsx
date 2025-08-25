import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import Navbar from '../Navbar';

const renderNavbar = () => {
  return render(<Navbar />);
};

describe('Navbar', () => {
  it('renders the DashWatch logo and title', () => {
    renderNavbar();

    expect(screen.getByText('DashWatch')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument(); // Logo letter
  });

  it('renders navigation links', () => {
    renderNavbar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders dark mode toggle button', () => {
    renderNavbar();

    const darkModeButton = screen.getByLabelText(/Switch to (light|dark) mode/);
    expect(darkModeButton).toBeInTheDocument();
  });

  it('renders mobile settings button', () => {
    renderNavbar();

    const mobileSettingsButton = screen.getByLabelText('Settings');
    expect(mobileSettingsButton).toBeInTheDocument();
  });

  it('applies active styles to current route', () => {
    renderNavbar();

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('text-primary', 'bg-primary/10');
  });
});
