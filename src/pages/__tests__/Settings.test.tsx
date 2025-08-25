import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import Settings from '../Settings';

// Mock the SettingsContext
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      gitlab: { instances: [] },
      uptime: { websites: [] },
      dns: { domains: [] },
      servers: { instances: [] },
    },
    saveSettings: vi.fn(),
    isLoading: false,
  })),
}));

const renderSettings = () => {
  return render(<Settings />);
};

describe('Settings', () => {
  it('renders the settings page title', () => {
    renderSettings();

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure your monitoring dashboard')).toBeInTheDocument();
  });

  it('renders all configuration tabs', () => {
    renderSettings();

    expect(screen.getByText('GitLab Projects')).toBeInTheDocument();
    expect(screen.getByText('Website Uptime')).toBeInTheDocument();
    expect(screen.getByText('DNS Records')).toBeInTheDocument();
    expect(screen.getByText('Server Monitoring')).toBeInTheDocument();
  });

  it('renders save and cancel buttons', () => {
    renderSettings();

    expect(screen.getByText('Save Settings')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders GitLab instances configuration by default', () => {
    renderSettings();

    expect(screen.getByText('GitLab Instances')).toBeInTheDocument();
    expect(screen.getByText('Configure your self-hosted GitLab instances to monitor')).toBeInTheDocument();
    expect(screen.getByText('Add GitLab Instance')).toBeInTheDocument();
  });
});
