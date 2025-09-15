// GitLab Dashboard Integration Component
// Provides a comprehensive dashboard view of all GitLab instances and projects

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  Star,
  Eye,
  Settings,
  Download,
  Share,
  Zap,
  Shield,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { GitlabInstance, GitlabProject } from '@/types';

// Dashboard configuration
interface DashboardConfig {
  layout: 'grid' | 'list';
  refreshInterval: number; // seconds
  showCharts: boolean;
  showMetrics: boolean;
  showAlerts: boolean;
  autoRefresh: boolean;
  theme: 'light' | 'dark' | 'auto';
  widgets: DashboardWidget[];
}

interface DashboardWidget {
  id: string;
  type: 'projects' | 'instances' | 'metrics' | 'alerts' | 'activity' | 'health';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  visible: boolean;
  config: Record<string, any>;
}

interface DashboardData {
  instances: GitlabInstance[];
  projects: GitlabProject[];
  metrics: DashboardMetrics;
  alerts: DashboardAlert[];
  activity: ActivityItem[];
  health: HealthStatus;
  lastUpdated: Date;
}

interface DashboardMetrics {
  totalProjects: number;
  totalInstances: number;
  healthyInstances: number;
  activeProjects: number;
  totalStars: number;
  totalForks: number;
  recentCommits: number;
  openIssues: number;
  openMergeRequests: number;
  pipelineSuccess: number;
  averageResponseTime: number;
}

interface DashboardAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  instanceId?: string;
  projectId?: number;
  timestamp: Date;
  acknowledged: boolean;
}

interface ActivityItem {
  id: string;
  type: 'commit' | 'merge' | 'issue' | 'pipeline' | 'release';
  title: string;
  description: string;
  instanceId: string;
  projectId?: number;
  user?: string;
  timestamp: Date;
  url?: string;
}

interface HealthStatus {
  overall: 'healthy' | 'warning' | 'error';
  instances: Record<string, 'healthy' | 'warning' | 'error'>;
  services: Record<string, 'healthy' | 'warning' | 'error'>;
  lastChecked: Date;
}

const GitlabDashboard: React.FC = () => {
  const { toast } = useToast();
  const [config] = useState<DashboardConfig>({
    layout: 'grid',
    refreshInterval: 300, // 5 minutes
    showCharts: true,
    showMetrics: true,
    showAlerts: true,
    autoRefresh: true,
    theme: 'auto',
    widgets: [
      { id: 'overview', type: 'metrics', title: 'Overview', size: 'large', position: { x: 0, y: 0 }, visible: true, config: {} },
      { id: 'instances', type: 'instances', title: 'Instances', size: 'medium', position: { x: 1, y: 0 }, visible: true, config: {} },
      { id: 'projects', type: 'projects', title: 'Projects', size: 'large', position: { x: 0, y: 1 }, visible: true, config: {} },
      { id: 'activity', type: 'activity', title: 'Recent Activity', size: 'medium', position: { x: 1, y: 1 }, visible: true, config: {} },
      { id: 'alerts', type: 'alerts', title: 'Alerts', size: 'small', position: { x: 2, y: 0 }, visible: true, config: {} },
      { id: 'health', type: 'health', title: 'Health Status', size: 'small', position: { x: 2, y: 1 }, visible: true, config: {} },
    ],
  });

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedInstance, setSelectedInstance] = useState<string>('all');

  // Load dashboard data
  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    if (!showLoading) setRefreshing(true);

    try {
      // This would integrate with all the GitLab services
      // For now, we'll simulate the data loading

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      const mockData: DashboardData = {
        instances: [
          {
            id: 'gitlab-com',
            name: 'GitLab.com',
            url: 'https://gitlab.com',
            token: '***',
          },
          {
            id: 'self-hosted',
            name: 'Self-Hosted GitLab',
            url: 'https://gitlab.example.com',
            token: '***',
          },
        ],
        projects: [
          {
            id: 1,
            name: 'example-project',
            description: 'An example project',
            status: 'healthy',
            openIssues: 5,
            branches: 3,
            pullRequests: 2,
            lastCommit: new Date().toISOString(),
            instanceUrl: 'https://gitlab.com',
            instanceId: 'gitlab-com',
            visibility: 'public',
            defaultBranch: 'main',
            createdAt: new Date(),
            updatedAt: new Date(),
            webUrl: 'https://gitlab.com/example/example-project',
            sshUrl: 'git@gitlab.com:example/example-project.git',
            httpUrl: 'https://gitlab.com/example/example-project.git',
            starCount: 42,
            forkCount: 12,
            lastActivityAt: new Date().toISOString(),
            openMergeRequestsCount: 2,
            permissions: {
              projectAccess: 30,
              groupAccess: null,
            },
            pipelineStatus: 'success',
          },
        ],
        metrics: {
          totalProjects: 25,
          totalInstances: 2,
          healthyInstances: 2,
          activeProjects: 18,
          totalStars: 1250,
          totalForks: 340,
          recentCommits: 45,
          openIssues: 23,
          openMergeRequests: 12,
          pipelineSuccess: 85,
          averageResponseTime: 245,
        },
        alerts: [
          {
            id: 'alert-1',
            type: 'warning',
            title: 'High Response Time',
            message: 'Average response time is above threshold',
            instanceId: 'gitlab-com',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            acknowledged: false,
          },
        ],
        activity: [
          {
            id: 'activity-1',
            type: 'commit',
            title: 'New commit pushed',
            description: 'Fixed bug in authentication flow',
            instanceId: 'gitlab-com',
            projectId: 1,
            user: 'john.doe',
            timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
            url: 'https://gitlab.com/example/example-project/commit/abc123',
          },
          {
            id: 'activity-2',
            type: 'pipeline',
            title: 'Pipeline completed',
            description: 'CI/CD pipeline finished successfully',
            instanceId: 'gitlab-com',
            projectId: 1,
            timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
            url: 'https://gitlab.com/example/example-project/pipelines/123',
          },
        ],
        health: {
          overall: 'healthy',
          instances: {
            'gitlab-com': 'healthy',
            'self-hosted': 'warning',
          },
          services: {
            'api': 'healthy',
            'cache': 'healthy',
            'database': 'warning',
          },
          lastChecked: new Date(),
        },
        lastUpdated: new Date(),
      };

      setData(mockData);

      if (!showLoading) {
        toast({
          title: 'Dashboard Updated',
          description: 'Dashboard data has been refreshed successfully.',
        });
      }

    } catch (error) {
      logger.error('Failed to load dashboard data', 'GitlabDashboard', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (config.autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData(false);
      }, config.refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [config.autoRefresh, config.refreshInterval]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    if (!data) return null;

    let filteredProjects = data.projects;
    let filteredAlerts = data.alerts;
    let filteredActivity = data.activity;

    // Filter by instance
    if (selectedInstance !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.instanceId === selectedInstance);
      filteredAlerts = filteredAlerts.filter(a => a.instanceId === selectedInstance);
      filteredActivity = filteredActivity.filter(a => a.instanceId === selectedInstance);
    }

    // Filter by time range
    const now = new Date();
    const timeRangeMs = {
      '1h': 1000 * 60 * 60,
      '24h': 1000 * 60 * 60 * 24,
      '7d': 1000 * 60 * 60 * 24 * 7,
      '30d': 1000 * 60 * 60 * 24 * 30,
    }[selectedTimeRange];

    const timeThreshold = new Date(now.getTime() - timeRangeMs);
    filteredAlerts = filteredAlerts.filter(a => a.timestamp >= timeThreshold);
    filteredActivity = filteredActivity.filter(a => a.timestamp >= timeThreshold);

    return {
      ...data,
      projects: filteredProjects,
      alerts: filteredAlerts,
      activity: filteredActivity,
    };
  }, [data, selectedInstance, selectedTimeRange]);

  // Handle manual refresh
  const handleRefresh = () => {
    loadDashboardData(false);
  };



  // Render loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">GitLab Dashboard</h1>
            <p className="text-muted-foreground">Monitor your GitLab instances and projects</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!filteredData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GitLab Dashboard</h1>
          <p className="text-muted-foreground">Monitor your GitLab instances and projects</p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={selectedTimeRange} onValueChange={(value: any) => setSelectedTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedInstance} onValueChange={setSelectedInstance}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instances</SelectItem>
              {filteredData.instances.map(instance => (
                <SelectItem key={instance.id} value={instance.id}>
                  {instance.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Health Status Alert */}
      {filteredData.health.overall !== 'healthy' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Health Issues Detected</AlertTitle>
          <AlertDescription>
            Some GitLab instances or services are experiencing issues. Check the health status below for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="instances">Instances</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredData.metrics.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredData.metrics.activeProjects} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Instances</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredData.metrics.totalInstances}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredData.metrics.healthyInstances} healthy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredData.metrics.openIssues}</div>
                <p className="text-xs text-muted-foreground">
                  Across all projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Success</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredData.metrics.pipelineSuccess}%</div>
                <Progress value={filteredData.metrics.pipelineSuccess} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your GitLab instances</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {filteredData.activity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {activity.type === 'commit' && <GitBranch className="h-4 w-4 text-green-500" />}
                        {activity.type === 'pipeline' && <Zap className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'merge' && <CheckCircle className="h-4 w-4 text-purple-500" />}
                        {activity.type === 'issue' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        {activity.type === 'release' && <Star className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user} • {activity.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instances" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredData.instances.map((instance) => (
              <Card key={instance.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {filteredData.health.instances[instance.id] === 'healthy' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : filteredData.health.instances[instance.id] === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span>{instance.name}</span>
                    </CardTitle>
                    <Badge variant={
                      filteredData.health.instances[instance.id] === 'healthy' ? 'default' :
                      filteredData.health.instances[instance.id] === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {filteredData.health.instances[instance.id]}
                    </Badge>
                  </div>
                  <CardDescription>{instance.url}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Projects</p>
                      <p className="text-2xl font-bold">
                        {filteredData.projects.filter(p => p.instanceId === instance.id).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Response Time</p>
                      <p className="text-2xl font-bold">{filteredData.metrics.averageResponseTime}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.projects.slice(0, 12).map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{project.visibility}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{project.starCount || 0}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Open Issues</p>
                        <p className="text-lg font-bold">{project.openIssues}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">MRs</p>
                        <p className="text-lg font-bold">{project.pullRequests}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Updated {new Date(project.lastActivityAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
                <CardDescription>Recent alerts and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {filteredData.alerts.map((alert) => (
                      <Alert key={alert.id}>
                        {alert.type === 'error' && <XCircle className="h-4 w-4" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                        {alert.type === 'info' && <Activity className="h-4 w-4" />}
                        {alert.type === 'success' && <CheckCircle className="h-4 w-4" />}
                        <AlertTitle>{alert.title}</AlertTitle>
                        <AlertDescription>{alert.message}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Health Overview</CardTitle>
                <CardDescription>Status of all services and instances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Status</span>
                    <Badge variant={filteredData.health.overall === 'healthy' ? 'default' : 'destructive'}>
                      {filteredData.health.overall}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Services</p>
                    {Object.entries(filteredData.health.services).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{service}</span>
                        <div className="flex items-center space-x-2">
                          {status === 'healthy' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : status === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">{status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Last updated: {filteredData.lastUpdated.toLocaleString()}</span>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GitlabDashboard;
