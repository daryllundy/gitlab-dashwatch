import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Star,
  GitFork,
  Calendar,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  GitCommit,
  Users,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common';
import { AnimatedNumber } from '@/components/common';

import { gitlabApiService } from '@/services/monitoring/gitlabApiService';
import type { GitlabProject, GitlabInstance } from '@/types';

interface GitlabProjectCardProps {
  project: GitlabProject;
  instance: GitlabInstance;
  isSelected?: boolean;
  onSelect?: (project: GitlabProject, selected: boolean) => void;
  onRefresh?: (project: GitlabProject) => void;
  showDetails?: boolean;
  compact?: boolean;
}

export const GitlabProjectCard: React.FC<GitlabProjectCardProps> = ({
  project,
  instance,
  isSelected = false,
  onSelect,
  onRefresh,
  showDetails = false,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detailedProject, setDetailedProject] = useState<GitlabProject | null>(null);
  const [lastCommit, setLastCommit] = useState<any>(null);

  const { toast } = useToast();

  // Load detailed project information when expanded
  useEffect(() => {
    if (isExpanded && !detailedProject) {
      loadDetailedProject();
    }
  }, [isExpanded]);

  const loadDetailedProject = async () => {
    try {
      setIsRefreshing(true);

      // Get detailed project information
      const detailed = await gitlabApiService.getProjectDetails(instance, project.id);
      if (detailed) {
        setDetailedProject(detailed);

        // Get last commit information
        if (detailed.lastCommitInfo) {
          setLastCommit(detailed.lastCommitInfo);
        }
      }
    } catch {
      console.error('Failed to load detailed project');
      toast({
        title: 'Failed to load project details',
        description: 'Could not load detailed information for this project.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDetailedProject();
      onRefresh?.(project);
      toast({
        title: 'Project refreshed',
        description: `${project.name} has been refreshed successfully.`,
      });
    } catch {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh project information.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelect = (selected: boolean) => {
    onSelect?.(project, selected);
  };

  const getStatusIcon = (status: GitlabProject['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPipelineStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'canceled':
        return <PauseCircle className="h-4 w-4 text-gray-500" />;
      case 'skipped':
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVisibilityBadge = (visibility: GitlabProject['visibility']) => {
    const variants = {
      public: 'default',
      private: 'secondary',
      internal: 'outline',
    } as const;

    return (
      <Badge variant={variants[visibility]} className="text-xs">
        {visibility}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return formatDate(date);
  };

  const getActivityTrend = () => {
    // Simple trend calculation based on recent activity
    const daysSinceUpdate = Math.floor((new Date().getTime() - project.updatedAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceUpdate <= 1) return { icon: TrendingUp, color: 'text-green-500', label: 'Very Active' };
    if (daysSinceUpdate <= 7) return { icon: TrendingUp, color: 'text-blue-500', label: 'Active' };
    if (daysSinceUpdate <= 30) return { icon: Minus, color: 'text-yellow-500', label: 'Moderate' };
    return { icon: TrendingDown, color: 'text-red-500', label: 'Inactive' };
  };

  const activityTrend = getActivityTrend();
  const TrendIcon = activityTrend.icon;

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleSelect(checked as boolean)}
            />

            <div className="flex items-center space-x-2">
              {getStatusIcon(project.status)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate text-sm">{project.name}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {project.description || 'No description'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{project.starCount}</span>
              </span>
              <span className="flex items-center space-x-1">
                <GitFork className="h-3 w-3" />
                <span>{project.forkCount}</span>
              </span>
            </div>

            <a
              href={project.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleSelect(checked as boolean)}
              className="mt-1"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getStatusIcon(project.status)}
                <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                {getVisibilityBadge(project.visibility)}
                <TrendIcon className={`h-4 w-4 ${activityTrend.color}`} />
              </div>

              <CardDescription className="mb-2 line-clamp-2">
                {project.description || 'No description available'}
              </CardDescription>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <GitBranch className="h-4 w-4" />
                  <AnimatedNumber value={project.branches} />
                  <span>branches</span>
                </span>

                <span className="flex items-center space-x-1">
                  <Star className="h-4 w-4" />
                  <AnimatedNumber value={project.starCount} />
                  <span>stars</span>
                </span>

                <span className="flex items-center space-x-1">
                  <GitFork className="h-4 w-4" />
                  <AnimatedNumber value={project.forkCount} />
                  <span>forks</span>
                </span>

                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {formatRelativeTime(project.updatedAt)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {project.pipelineStatus && (
              <div className="flex items-center space-x-1">
                {getPipelineStatusIcon(project.pipelineStatus)}
                <span className="text-xs capitalize">{project.pipelineStatus}</span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a
                    href={project.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on GitLab
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isRefreshing ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner text="Loading project details..." />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Project Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <GitCommit className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={project.commitCount || 0} />
                    </div>
                    <div className="text-xs text-muted-foreground">Commits</div>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={project.openMergeRequestsCount || 0} />
                    </div>
                    <div className="text-xs text-muted-foreground">MRs</div>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Activity className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={project.openIssues || 0} />
                    </div>
                    <div className="text-xs text-muted-foreground">Issues</div>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Zap className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold">
                      <AnimatedNumber value={project.branchCount || project.branches} />
                    </div>
                    <div className="text-xs text-muted-foreground">Branches</div>
                  </div>
                </div>

                {/* Last Commit Information */}
                {lastCommit && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium mb-2 flex items-center">
                      <GitCommit className="h-4 w-4 mr-2" />
                      Latest Commit
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{lastCommit.message || lastCommit.title}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{lastCommit.authorName || lastCommit.author?.name}</span>
                        <span>{formatRelativeTime(new Date(lastCommit.committedDate || lastCommit.committed_date))}</span>
                      </div>
                      {lastCommit.webUrl && (
                        <a
                          href={lastCommit.webUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View commit <ExternalLink className="h-3 w-3 inline" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Pipeline Status */}
                {project.pipelineStatus && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium mb-2 flex items-center">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Pipeline Status
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getPipelineStatusIcon(project.pipelineStatus)}
                      <span className="text-sm capitalize">{project.pipelineStatus}</span>
                      <Badge variant="outline" className="text-xs">
                        {instance.name}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Project URLs */}
                <div className="flex items-center space-x-4 text-sm">
                  <a
                    href={project.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center space-x-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Project Page</span>
                  </a>

                  {project.sshUrl && (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(project.sshUrl);
                        toast({
                          title: 'SSH URL copied',
                          description: 'SSH clone URL has been copied to clipboard.',
                        });
                      }}
                      className="text-blue-500 hover:underline flex items-center space-x-1"
                    >
                      <GitBranch className="h-4 w-4" />
                      <span>SSH</span>
                    </a>
                  )}

                  {project.httpUrl && (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(project.httpUrl);
                        toast({
                          title: 'HTTP URL copied',
                          description: 'HTTP clone URL has been copied to clipboard.',
                        });
                      }}
                      className="text-blue-500 hover:underline flex items-center space-x-1"
                    >
                      <GitBranch className="h-4 w-4" />
                      <span>HTTP</span>
                    </a>
                  )}
                </div>

                {/* Activity Trend */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <TrendIcon className={`h-4 w-4 ${activityTrend.color}`} />
                    <span className="text-muted-foreground">{activityTrend.label}</span>
                  </div>
                  <span className="text-muted-foreground">
                    Last activity: {formatDate(project.lastActivityAt || project.updatedAt)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default GitlabProjectCard;
