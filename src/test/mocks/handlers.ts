import { http, HttpResponse } from 'msw';

export const handlers = [
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

  // Mock external monitoring APIs
  http.get('*/api/uptime/*', () => {
    return HttpResponse.json({
      status: 'up',
      response_time: 150,
      last_checked: new Date().toISOString(),
    });
  }),

  http.get('*/api/dns/*', () => {
    return HttpResponse.json({
      records: [
        { type: 'A', value: '192.168.1.1' },
        { type: 'MX', value: 'mail.example.com' },
      ],
    });
  }),

  // Mock Netdata API for server monitoring
  http.get('*/api/v1/info', () => {
    return HttpResponse.json({
      hostname: 'test-server',
      version: '1.0.0',
      os: 'linux',
    });
  }),
];
