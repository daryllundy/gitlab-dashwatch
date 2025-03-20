import React, { useState, useEffect } from 'react';
import { Monitor, Check, X, Settings } from 'lucide-react';
import StatusCard from './StatusCard';
import AnimatedNumber from './AnimatedNumber';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from './ui/button';

const UptimeSection = () => {
  const [websites, setWebsites] = useState([]);
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Generate mock website data based on configured websites
  useEffect(() => {
    if (settings.uptime.websites.length === 0) {
      // Default mock data if no real data is available
      setWebsites([
        {
          id: 1,
          name: 'Main Website',
          url: 'https://example.com',
          status: 'healthy',
          uptime: 99.98,
          responseTime: 187,
          lastCheck: '2m ago',
          incidents: 0,
        },
        {
          id: 2,
          name: 'API Service',
          url: 'https://api.example.com',
          status: 'warning',
          uptime: 98.45,
          responseTime: 312,
          lastCheck: '3m ago',
          incidents: 2,
        },
        {
          id: 3,
          name: 'Customer Portal',
          url: 'https://customers.example.com',
          status: 'healthy',
          uptime: 99.99,
          responseTime: 145,
          lastCheck: '1m ago',
          incidents: 0,
        },
        {
          id: 4,
          name: 'Document Service',
          url: 'https://docs.example.com',
          status: 'error',
          uptime: 95.32,
          responseTime: 525,
          lastCheck: '5m ago',
          incidents: 5,
        },
      ]);
    } else {
      // Generate mock data based on configured websites
      const mockWebsites = settings.uptime.websites.map((site, index) => {
        const statuses = ['healthy', 'healthy', 'healthy', 'warning', 'error'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const uptime = randomStatus === 'healthy' ? 99 + Math.random() : 
                      randomStatus === 'warning' ? 95 + Math.random() * 4 : 
                      90 + Math.random() * 5;
        
        return {
          id: index + 1,
          name: site.name,
          url: site.url,
          status: randomStatus,
          uptime: uptime,
          responseTime: Math.floor(Math.random() * 400) + 100,
          lastCheck: `${Math.floor(Math.random() * 10) + 1}m ago`,
          incidents: randomStatus === 'healthy' ? 0 : 
                    randomStatus === 'warning' ? Math.floor(Math.random() * 3) + 1 : 
                    Math.floor(Math.random() * 5) + 3,
        };
      });
      
      setWebsites(mockWebsites);
    }
  }, [settings.uptime.websites]);

  const navigateToSettings = () => {
    navigate('/settings');
  };

  // Count online and offline websites
  const onlineCount = websites.filter(site => site.status !== 'error').length;
  const offlineCount = websites.filter(site => site.status === 'error').length;

  return (
    <div className="section-appear" style={{ '--delay': 3 } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Website Uptime</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitoring your web services</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-primary flex items-center gap-1"
            onClick={navigateToSettings}
          >
            <Settings className="h-4 w-4" />
            Configure
          </Button>
          <div className="text-sm flex items-center gap-1.5">
            <Check className="h-4 w-4 text-success" />
            <span className="font-medium">{onlineCount} Online</span>
          </div>
          <div className="text-sm flex items-center gap-1.5">
            <X className="h-4 w-4 text-destructive" />
            <span className="font-medium">{offlineCount} Offline</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {websites.map((site, index) => (
          <StatusCard
            key={site.id}
            title={site.name}
            subtitle={site.url}
            icon={Monitor}
            status={site.status as any}
            className="card-appear"
            style={{ '--delay': index + 1 } as React.CSSProperties}
          >
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div className="text-xs text-muted-foreground">Uptime</div>
                <div className="font-medium">
                  <AnimatedNumber 
                    value={site.uptime} 
                    formatter={(val) => val.toFixed(2) + '%'} 
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Response</div>
                <div className="font-medium">
                  <AnimatedNumber 
                    value={site.responseTime} 
                    formatter={(val) => `${val}ms`} 
                  />
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Last check: {site.lastCheck}
            </div>
          </StatusCard>
        ))}
      </div>
    </div>
  );
};

export default UptimeSection;
