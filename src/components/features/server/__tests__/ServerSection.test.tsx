import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { ServerSection } from '../ServerSection';

// Mock the SettingsContext
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      servers: { 
        instances: [
          { name: 'Test Server', ip: '192.168.1.1', netdataUrl: 'http://192.168.1.1:19999' }
        ] 
      },
    },
  })),
}));

describe('ServerSection', () => {
  it('renders Server section title', () => {
    render(<ServerSection />);

    expect(screen.getByText('Server Monitoring')).toBeInTheDocument();
  });

  it('renders servers from settings', () => {
    render(<ServerSection />);

    expect(screen.getByText('Test Server')).toBeInTheDocument();
  });
});
