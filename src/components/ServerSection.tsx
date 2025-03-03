
import React from 'react';
import { Server, Database, HardDrive, Activity } from 'lucide-react';
import StatusCard from './StatusCard';
import AnimatedNumber from './AnimatedNumber';

// Mock data
const servers = [
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
];

const ServerSection = () => {
  return (
    <div className="section-appear" style={{ '--delay': 4 } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Server Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">Hardware and system performance</p>
        </div>
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
            </div>
          </StatusCard>
        ))}
      </div>
    </div>
  );
};

export default ServerSection;
