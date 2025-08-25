import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { UptimeSection } from '../UptimeSection';

// Mock the SettingsContext
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      uptime: { 
        websites: [
          { name: 'Test Website', url: 'https://example.com' }
        ] 
      },
    },
  })),
}));

describe('UptimeSection', () => {
  it('renders Uptime section title', () => {
    render(<UptimeSection />);

    expect(screen.getByText('Website Uptime')).toBeInTheDocument();
  });

  it('renders websites from settings', () => {
    render(<UptimeSection />);

    expect(screen.getByText('Test Website')).toBeInTheDocument();
  });
});
