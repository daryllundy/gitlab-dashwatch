import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { GitlabSection } from '../GitlabSection';

// Mock the SettingsContext
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      gitlab: { 
        instances: [
          { name: 'Test GitLab', url: 'https://gitlab.example.com', token: '' }
        ] 
      },
    },
  })),
}));

describe('GitlabSection', () => {
  it('renders GitLab section title', () => {
    render(<GitlabSection />);

    expect(screen.getByText('GitLab Projects')).toBeInTheDocument();
  });

  it('renders GitLab instances from settings', () => {
    render(<GitlabSection />);

    expect(screen.getByText('Test GitLab')).toBeInTheDocument();
  });
});
