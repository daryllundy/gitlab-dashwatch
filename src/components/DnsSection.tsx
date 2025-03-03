
import React from 'react';
import { Globe } from 'lucide-react';
import StatusCard from './StatusCard';

// Mock data
const dnsRecords = [
  {
    id: 1,
    domain: 'example.com',
    type: 'A',
    value: '192.168.1.1',
    ttl: 3600,
    status: 'healthy',
    lastCheck: '5m ago',
  },
  {
    id: 2,
    domain: 'api.example.com',
    type: 'CNAME',
    value: 'example.com',
    ttl: 3600,
    status: 'healthy',
    lastCheck: '5m ago',
  },
  {
    id: 3,
    domain: 'example.com',
    type: 'MX',
    value: 'mail.example.com',
    ttl: 3600,
    status: 'warning',
    lastCheck: '10m ago',
  },
  {
    id: 4,
    domain: 'example.com',
    type: 'TXT',
    value: 'v=spf1 include:_spf.google.com ~all',
    ttl: 3600,
    status: 'healthy',
    lastCheck: '15m ago',
  },
];

const DnsSection = () => {
  return (
    <div className="section-appear" style={{ '--delay': 2 } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">DNS Records</h2>
          <p className="text-sm text-muted-foreground mt-1">Status of your domain records</p>
        </div>
        <button className="text-sm font-medium text-primary hover:underline">
          Refresh Records
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dnsRecords.map((record, index) => (
          <StatusCard
            key={record.id}
            title={`${record.domain}`}
            subtitle={`${record.type} Record`}
            icon={Globe}
            status={record.status as any}
            className="card-appear"
            style={{ '--delay': index + 1 } as React.CSSProperties}
          >
            <div className="mt-1">
              <div className="text-sm font-mono truncate" title={record.value}>
                {record.value}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>TTL: {record.ttl}s</span>
                <span>Checked: {record.lastCheck}</span>
              </div>
            </div>
          </StatusCard>
        ))}
      </div>
    </div>
  );
};

export default DnsSection;
