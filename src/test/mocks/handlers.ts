import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase auth
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: 'test@example.com',
      },
    });
  }),

  // Mock GitLab API
  http.get('*/api/v4/projects', () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'Test Project',
        description: 'Test description',
        web_url: 'https://gitlab.example.com/test-project',
        open_issues_count: 5,
        default_branch: 'main',
      },
    ]);
  }),

  // Mock Supabase database operations
  http.get('*/rest/v1/gitlab_instances', () => {
    return HttpResponse.json([
      {
        id: '1',
        user_id: 'mock-user-id',
        url: 'https://gitlab.example.com',
        name: 'Test GitLab',
        token: 'mock-token',
      },
    ]);
  }),

  http.get('*/rest/v1/uptime_websites', () => {
    return HttpResponse.json([
      {
        id: '1',
        user_id: 'mock-user-id',
        url: 'https://example.com',
        name: 'Test Website',
      },
    ]);
  }),

  http.get('*/rest/v1/dns_domains', () => {
    return HttpResponse.json([
      {
        id: '1',
        user_id: 'mock-user-id',
        domain: 'example.com',
        record_types: ['A', 'MX'],
      },
    ]);
  }),

  http.get('*/rest/v1/server_instances', () => {
    return HttpResponse.json([
      {
        id: '1',
        user_id: 'mock-user-id',
        name: 'Test Server',
        ip: '192.168.1.100',
        netdata_url: 'http://192.168.1.100:19999',
      },
    ]);
  }),
];