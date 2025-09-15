import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  GitBranch,
  Star,
  GitFork,
  Calendar,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common';

import { gitlabApiService } from '@/services/monitoring/gitlabApiService';
import { gitlabSettingsService } from '@/services/settings/gitlabSettingsService';
import type { GitlabProject, GitlabInstance } from '@/types';

interface GitlabProjectsProps {
  onProjectSelect?: (project: GitlabProject, selected: boolean) => void;
  selectedProjects?: number[];
}

export const GitlabProjects: React.FC<GitlabProjectsProps> = ({
  onProjectSelect,
  selectedProjects = []
}) => {
  const [projects, setProjects] = useState<GitlabProject[]>([]);
  const [instances, setInstances] = useState<GitlabInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created' | 'stars'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'private' | 'internal'>('all');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const { toast } = useToast();

  // Load instances on mount
  useEffect(() => {
    loadInstances();
  }, []);

  // Load projects when instances change
  useEffect(() => {
    if (instances.length > 0) {
      loadProjects();
    }
  }, [instances]);

  const loadInstances = async () => {
    try {
      const loadedInstances = gitlabSettingsService.getActiveInstances();
      setInstances(loadedInstances);
    } catch {
      toast({
        title: 'Error loading instances',
        description: 'Failed to load GitLab instances.',
        variant: 'destructive',
      });
    }
  };

  const loadProjects = async () => {
    if (instances.length === 0) return;

    try {
      setIsLoading(true);
      const allProjects: GitlabProject[] = [];

      for (const instance of instances) {
        try {
          const instanceProjects = await gitlabApiService.getProjects(instance);
          allProjects.push(...instanceProjects);
        } catch {
          console.error(`Failed to load projects for instance ${instance.name}`);
          // Continue with other instances
        }
      }

      setProjects(allProjects);
    } catch {
      toast({
        title: 'Error loading projects',
        description: 'Failed to load GitLab projects. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInstance = async (instanceId: string) => {
    setRefreshing(prev => new Set(prev).add(instanceId));

    try {
      const instance = instances.find(inst => inst.id === instanceId);
      if (!instance) return;

      const instanceProjects = await gitlabApiService.getProjects(instance);

      // Update projects for this instance
      setProjects(prev => {
        const filtered = prev.filter(p => p.instanceId !== instanceId);
        return [...filtered, ...instanceProjects];
      });

      toast({
        title: 'Projects refreshed',
        description: `Successfully refreshed projects for ${instance.name}.`,
      });
    } catch {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh projects. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceId);
        return newSet;
      });
    }
  };

  const handleProjectSelect = (project: GitlabProject, selected: boolean) => {
    onProjectSelect?.(project, selected);
  };

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    const filtered = projects.filter(project => {
      // Search filter
      if (searchTerm && !project.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !project.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Instance filter
      if (selectedInstance !== 'all' && project.instanceId !== selectedInstance) {
        return false;
      }

      // Visibility filter
      if (filterVisibility !== 'all' && project.visibility !== filterVisibility) {
        return false;
      }

      // Selected projects filter
      if (showOnlySelected && !selectedProjects.includes(project.id)) {
        return false;
      }

      return true;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'updated':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'stars':
          aValue = a.starCount;
          bValue = b.starCount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, searchTerm, selectedInstance, sortBy, sortOrder, filterVisibility, showOnlySelected, selectedProjects]);

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
    }).format(date);
  };

  const getInstanceName = (instanceId: string) => {
    const instance = instances.find(inst => inst.id === instanceId);
    return instance?.name || 'Unknown Instance';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="Loading GitLab projects..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GitLab Projects</h2>
          <p className="text-muted-foreground">
            Browse and select projects from your configured GitLab instances
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {instances.map((instance) => (
            <Button
              key={instance.id}
              variant="outline"
              size="sm"
              onClick={() => refreshInstance(instance.id)}
              disabled={refreshing.has(instance.id)}
            >
              {refreshing.has(instance.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {instance.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Instance Filter */}
            <div className="space-y-2">
              <Label htmlFor="instance">Instance</Label>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger>
                  <SelectValue placeholder="All instances" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All instances</SelectItem>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="stars">Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility Filter */}
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={filterVisibility} onValueChange={(value: any) => setFilterVisibility(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-selected"
                checked={showOnlySelected}
                onCheckedChange={(checked) => setShowOnlySelected(checked as boolean)}
              />
              <Label htmlFor="show-selected" className="text-sm">
                Show only selected projects
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="sort-order" className="text-sm">Order:</Label>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {filteredAndSortedProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || selectedInstance !== 'all' || filterVisibility !== 'all'
                ? 'Try adjusting your filters to see more projects.'
                : 'No projects are available from your configured instances.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedProjects.length} of {projects.length} projects
            </p>
          </div>

          <div className="grid gap-4">
            {filteredAndSortedProjects.map((project) => (
              <Card key={`${project.instanceId}-${project.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={(checked) => handleProjectSelect(project, checked as boolean)}
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusIcon(project.status)}
                          <h3 className="font-semibold truncate">{project.name}</h3>
                          {getVisibilityBadge(project.visibility)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {project.description || 'No description available'}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <GitBranch className="h-3 w-3" />
                            <span>{project.branches} branches</span>
                          </span>

                          <span className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>{project.starCount} stars</span>
                          </span>

                          <span className="flex items-center space-x-1">
                            <GitFork className="h-3 w-3" />
                            <span>{project.forkCount} forks</span>
                          </span>

                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Updated {formatDate(project.updatedAt)}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {getInstanceName(project.instanceId)}
                          </span>

                          <a
                            href={project.webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center space-x-1"
                          >
                            <span>View on GitLab</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GitlabProjects;
