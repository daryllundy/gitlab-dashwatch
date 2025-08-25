// Monitoring domain services
export { gitlabApiService } from './gitlabApiService';
export type { GitlabInstance, GitlabProject } from './gitlabApiService';

export { uptimeMonitoringService } from './uptimeMonitoringService';
export type { UptimeTarget, UptimeStatus, UptimeStats } from './uptimeMonitoringService';

export { dnsMonitoringService } from './dnsMonitoringService';
export type { DnsTarget, DnsRecord, DnsStats } from './dnsMonitoringService';

export { serverMonitoringService } from './serverMonitoringService';
export type { ServerTarget, ServerMetrics, ServerStats } from './serverMonitoringService';
