import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { DnsSection } from '../DnsSection';

// Mock the SettingsContext
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      dns: { 
        domains: [
          { domain: 'example.com', recordTypes: ['A', 'CNAME'] }
        ] 
      },
    },
  })),
}));

describe('DnsSection', () => {
  it('renders DNS section title', () => {
    render(<DnsSection />);

    expect(screen.getByText('DNS Records')).toBeInTheDocument();
  });

  it('renders domains from settings', () => {
    render(<DnsSection />);

    expect(screen.getByText('example.com')).toBeInTheDocument();
  });
});
