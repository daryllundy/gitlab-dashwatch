
import React, { useState, useEffect } from 'react';
import { Globe, Settings } from 'lucide-react';
import StatusCard from './StatusCard';
import { useNavigate } from 'react-router-dom';

const DnsSection = () => {
  const [dnsRecords, setDnsRecords] = useState([]);
  const [domains, setDomains] = useState([]);
  const navigate = useNavigate();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('dashboardSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.dns && settings.dns.domains) {
          setDomains(settings.dns.domains);
        }
      } catch (e) {
        console.error('Failed to parse settings from localStorage:', e);
      }
    }
  }, []);

  // Generate mock DNS records based on configured domains
  useEffect(() => {
    if (domains.length === 0) {
      // Default mock data if no real data is available
      setDnsRecords([
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
      ]);
    } else {
      // Generate mock records based on configured domains
      const newRecords = [];
      let id = 1;
      
      domains.forEach(domain => {
        domain.recordTypes.forEach(type => {
          newRecords.push({
            id: id++,
            domain: domain.domain,
            type,
            value: getMockValueForRecordType(type, domain.domain),
            ttl: 3600,
            status: getRandomStatus(),
            lastCheck: `${Math.floor(Math.random() * 30) + 1}m ago`,
          });
        });
      });
      
      setDnsRecords(newRecords);
    }
  }, [domains]);

  const getMockValueForRecordType = (type, domain) => {
    switch (type) {
      case 'A':
        return `192.168.1.${Math.floor(Math.random() * 255)}`;
      case 'CNAME':
        return domain.replace(/^[^.]+\./, '');
      case 'MX':
        return `mail.${domain}`;
      case 'TXT':
        return 'v=spf1 include:_spf.google.com ~all';
      default:
        return '127.0.0.1';
    }
  };

  const getRandomStatus = () => {
    const statuses = ['healthy', 'healthy', 'healthy', 'warning', 'error'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const refreshRecords = () => {
    // This would be an API call in a real application
    const savedSettings = localStorage.getItem('dashboardSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.dns && settings.dns.domains) {
          setDomains(settings.dns.domains);
        }
      } catch (e) {
        console.error('Failed to parse settings from localStorage:', e);
      }
    }
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="section-appear" style={{ '--delay': 2 } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">DNS Records</h2>
          <p className="text-sm text-muted-foreground mt-1">Status of your domain records</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            onClick={navigateToSettings}
          >
            <Settings className="h-4 w-4" />
            Configure
          </button>
          <button 
            className="text-sm font-medium text-primary hover:underline"
            onClick={refreshRecords}
          >
            Refresh Records
          </button>
        </div>
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
