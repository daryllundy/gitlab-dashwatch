// Default configuration data
export const DEFAULT_GITLAB_INSTANCES = [
  { url: 'https://gitlab.example.com', name: 'Main GitLab', token: '' }
] as const;

export const DEFAULT_UPTIME_WEBSITES = [
  { url: 'https://example.com', name: 'Main Website' },
  { url: 'https://api.example.com', name: 'API Service' },
  { url: 'https://customers.example.com', name: 'Customer Portal' },
  { url: 'https://docs.example.com', name: 'Document Service' }
] as const;

export const DEFAULT_DNS_DOMAINS = [
  { domain: 'example.com', recordTypes: ['A', 'MX', 'TXT'] },
  { domain: 'api.example.com', recordTypes: ['CNAME'] }
] as const;

export const DEFAULT_SERVER_INSTANCES = [
  { name: 'Web Server', ip: '192.168.1.101', netdataUrl: 'http://192.168.1.101:19999' },
  { name: 'Database Server', ip: '192.168.1.102', netdataUrl: 'http://192.168.1.102:19999' },
  { name: 'Application Server', ip: '192.168.1.103', netdataUrl: 'http://192.168.1.103:19999' },
  { name: 'Cache Server', ip: '192.168.1.104', netdataUrl: 'http://192.168.1.104:19999' }
] as const;

// Version progression for migrations
export const VERSION_PROGRESSION = ['0.9.0', '1.0.0', '1.1.0'] as const;
