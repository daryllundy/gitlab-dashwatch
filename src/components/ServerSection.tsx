import React, { useState, useEffect } from 'react';
import { Server, Database, HardDrive, Activity, Settings } from 'lucide-react';
import StatusCard from './StatusCard';
import AnimatedNumber from './AnimatedNumber';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from './ui/button';

// Function to fetch server metrics from Netdata
const fetchNetdataMetrics = async (url) => {
  try {
    // Cross-origin requests might be blocked, so this is a mock implementation
    // In production, you'd need a proxy server or CORS-enabled Netdata
    console.log(`Fetching metrics from Netdata: ${url}`);
    
    // Simulating API response time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response
    return {
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      diskUsage: Math.floor(Math.random() * 100),
      uptime: `${Math.floor(Math.random() * 90) + 10}d ${Math.floor(Math.random() * 24)}h`,
    };
  } catch (error) {
    console.error('Error fetching Netdata metrics:', error);
    throw error;
  }
};

const ServerSection = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();

  // Fetch server metrics from Netdata
  useEffect(() => {
    const fetchAllServerMetrics = async () => {
      if (settings.servers.instances.length === 0) {
        // Use default mock data if no servers are configured
        setServers([
          {
            id: 1,
            name: 'Web Server',
            ip: '192.168.1.101',
            status: 'healthy',
            cpuUsage: 23,
            memoryUsage: 45,
            diskUsage: 65,
            uptime: '45d 12h',
          },
          {
            id: 2,
            name: 'Database Server',
            ip: '192.168.1.102',
            status: 'warning',
            cpuUsage: 78,
            memoryUsage: 82,
            diskUsage: 45,
            uptime: '23d 5h',
          },
          {
            id: 3,
            name: 'Application Server',
            ip: '192.168.1.103',
            status: 'healthy',
            cpuUsage: 35,
            memoryUsage: 55,
            diskUsage: 30,
            uptime: '67d 3h',
          },
          {
            id: 4,
            name: 'Cache Server',
            ip: '192.168.1.104',
            status: 'healthy',
            cpuUsage: 15,
            memoryUsage: 60,
            diskUsage: 25,
            uptime: '32d 18h',
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        const serverData = await Promise.all(
          settings.servers.instances.map(async (server, index) => {
            try {
              if (!server.netdataUrl) {
                // Generate mock data if no Netdata URL is provided
                return {
                  id: index + 1,
                  name: server.name,
                  ip: server.ip,
                  status: getRandomStatus(),
                  cpuUsage: Math.floor(Math.random() * 100),
                  memoryUsage: Math.floor(Math.random() * 100),
                  diskUsage: Math.floor(Math.random() * 100),
                  uptime: `${Math.floor(Math.random() * 90) + 10}d ${Math.floor(Math.random() * 24)}h`,
                };
              }

              const metrics = await fetchNetdataMetrics(server.netdataUrl);
              
              // Determine status based on metrics
              let status = 'healthy';
              if (metrics.cpuUsage > 80 || metrics.memoryUsage > 80 || metrics.diskUsage > 80) {
                status = 'error';
              } else if (metrics.cpuUsage > 60 || metrics.memoryUsage > 60 || metrics.diskUsage > 60) {
                status = 'warning';
              }
              
              return {
                id: index + 1,
                name: server.name,
                ip: server.ip,
                status,
                cpuUsage: metrics.cpuUsage,
                memoryUsage: metrics.memoryUsage,
                diskUsage: metrics.diskUsage,
                uptime: metrics.uptime,
                netdataUrl: server.netdataUrl,
              };
            } catch (error) {
              // If fetching fails, return server with error status
              console.error(`Error fetching data for server ${server.name}:`, error);
              return {
                id: index + 1,
                name: server.name,
                ip: server.ip,
                status: 'error',
                cpuUsage: 0,
                memoryUsage: 0,
                diskUsage: 0,
                uptime: 'Unknown',
                error: true,
              };
            }
          })
        );
        
        setServers(serverData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch server metrics:', error);
        toast({
          title: "Failed to fetch server metrics",
          description: "Check your Netdata configuration in settings.",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchAllServerMetrics();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(fetchAllServerMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [settings.servers.instances, toast]);

  const getRandomStatus = () => {
    const statuses = ['healthy', 'healthy', 'healthy', 'warning', 'error'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  const openNetdataInterface = (server) => {
    if (server.netdataUrl) {
      window.open(server.netdataUrl, '_blank');
    } else {
      toast({
        title: "Netdata URL not configured",
        description: "Configure the Netdata URL in settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="section-appear" style={{ '--delay': 4 } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Server Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">Hardware and system performance</p>
        </div>
        <Button 
          variant="ghost"
          size="sm"
          className="text-sm font-medium text-primary flex items-center gap-1"
          onClick={navigateToSettings}
        >
          <Settings className="h-4 w-4" />
          Configure
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {servers.map((server, index) => (
          <StatusCard
            key={server.id}
            title={server.name}
            subtitle={server.ip}
            icon={Server}
            status={server.status as any}
            className="card-appear"
            style={{ '--delay': index + 1 } as React.CSSProperties}
            onClick={() => openNetdataInterface(server)}
          >
            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">CPU</span>
                </div>
                <div className="text-sm font-medium">
                  <AnimatedNumber 
                    value={server.cpuUsage} 
                    formatter={(val) => `${val}%`} 
                  />
                </div>
                <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      server.cpuUsage > 80 ? 'bg-destructive' : 
                      server.cpuUsage > 60 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${server.cpuUsage}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">RAM</span>
                </div>
                <div className="text-sm font-medium">
                  <AnimatedNumber 
                    value={server.memoryUsage} 
                    formatter={(val) => `${val}%`} 
                  />
                </div>
                <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      server.memoryUsage > 80 ? 'bg-destructive' : 
                      server.memoryUsage > 60 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${server.memoryUsage}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs">Disk</span>
                </div>
                <div className="text-sm font-medium">
                  <AnimatedNumber 
                    value={server.diskUsage} 
                    formatter={(val) => `${val}%`} 
                  />
                </div>
                <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      server.diskUsage > 80 ? 'bg-destructive' : 
                      server.diskUsage > 60 ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${server.diskUsage}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground mt-3">
              Uptime: {server.uptime}
              {server.netdataUrl && <div className="text-xs text-primary mt-1 cursor-pointer hover:underline">View Netdata dashboard →</div>}
            </div>
          </StatusCard>
        ))}
      </div>
    </div>
  );
};

export default ServerSection;
