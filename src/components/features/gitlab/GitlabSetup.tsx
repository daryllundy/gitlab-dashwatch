import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Settings,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common';

import { gitlabSettingsService } from '@/services/settings/gitlabSettingsService';
import { gitlabTokenService } from '@/services/auth/gitlabTokenService';
import { gitlabApiService } from '@/services/monitoring/gitlabApiService';
import type { GitlabInstance } from '@/types';

// Form validation schema
const gitlabInstanceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  url: z.string().url('Must be a valid URL').refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    'URL must start with http:// or https://'
  ),
  token: z.string().min(20, 'Token must be at least 20 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

type GitlabInstanceForm = z.infer<typeof gitlabInstanceSchema>;

interface GitlabSetupProps {
  onInstanceChange?: () => void;
}

export const GitlabSetup: React.FC<GitlabSetupProps> = ({ onInstanceChange }) => {
  const [instances, setInstances] = useState<GitlabInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingConnections, setTestingConnections] = useState<Set<string>>(new Set());
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<GitlabInstance | null>(null);

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GitlabInstanceForm>({
    resolver: zodResolver(gitlabInstanceSchema),
    defaultValues: {
      name: '',
      url: '',
      token: '',
      description: '',
    },
  });

  // Load instances on mount
  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      setIsLoading(true);
      const loadedInstances = gitlabSettingsService.getInstances();
      setInstances(loadedInstances);
    } catch {
      toast({
        title: 'Error loading instances',
        description: 'Failed to load GitLab instances. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInstance = async (data: GitlabInstanceForm) => {
    try {
      const newInstance: GitlabInstance = {
        id: `gitlab-${Date.now()}`,
        name: data.name,
        url: data.url.replace(/\/$/, ''), // Remove trailing slash
        token: data.token,
        description: data.description || '',
        isActive: true,
        apiVersion: 'v4',
        connectionStatus: 'disconnected',
        selectedProjects: [],
        fetchOptions: {
          page: 1,
          perPage: 20,
          orderBy: 'last_activity_at',
          sort: 'desc',
        },
      };

      const result = await gitlabSettingsService.addInstance(newInstance);

      if (result.isValid) {
        // Store the token securely
        await gitlabTokenService.storeToken(newInstance, data.token);

        toast({
          title: 'Instance added',
          description: `${newInstance.name} has been added successfully.`,
        });

        reset();
        setDialogOpen(false);
        await loadInstances();
        onInstanceChange?.();
      } else {
        toast({
          title: 'Validation failed',
          description: result.errors.map(e => e.message).join(', '),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error adding instance',
        description: 'Failed to add GitLab instance. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditInstance = (instance: GitlabInstance) => {
    setEditingInstance(instance);
    setValue('name', instance.name);
    setValue('url', instance.url);
    setValue('token', ''); // Don't show existing token for security
    setValue('description', instance.description || '');
    setDialogOpen(true);
  };

  const handleUpdateInstance = async (data: GitlabInstanceForm) => {
    if (!editingInstance) return;

    try {
      const updates: Partial<GitlabInstance> = {
        name: data.name,
        url: data.url.replace(/\/$/, ''),
        description: data.description || '',
      };

      // Only update token if it was changed
      if (data.token && data.token !== '') {
        updates.token = data.token;
      }

      const result = await gitlabSettingsService.updateInstance(editingInstance.id, updates);

      if (result.isValid) {
        // Update token if it was changed
        if (data.token && data.token !== '') {
          await gitlabTokenService.updateToken(editingInstance, data.token);
        }

        toast({
          title: 'Instance updated',
          description: `${data.name} has been updated successfully.`,
        });

        reset();
        setDialogOpen(false);
        setEditingInstance(null);
        await loadInstances();
        onInstanceChange?.();
      } else {
        toast({
          title: 'Validation failed',
          description: result.errors.map(e => e.message).join(', '),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error updating instance',
        description: 'Failed to update GitLab instance. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInstance = async (instanceId: string, instanceName: string) => {
    try {
      const success = await gitlabSettingsService.removeInstance(instanceId);
      if (success) {
        // Remove token as well
        await gitlabTokenService.removeToken(instanceId);

        toast({
          title: 'Instance removed',
          description: `${instanceName} has been removed successfully.`,
        });

        await loadInstances();
        onInstanceChange?.();
      } else {
        toast({
          title: 'Error removing instance',
          description: 'Failed to remove GitLab instance. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error removing instance',
        description: 'Failed to remove GitLab instance. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (instanceId: string, isActive: boolean) => {
    try {
      const success = await gitlabSettingsService.setInstanceActive(instanceId, isActive);
      if (success) {
        toast({
          title: isActive ? 'Instance activated' : 'Instance deactivated',
          description: `GitLab instance has been ${isActive ? 'activated' : 'deactivated'}.`,
        });

        await loadInstances();
        onInstanceChange?.();
      }
    } catch (error) {
      toast({
        title: 'Error updating instance',
        description: 'Failed to update instance status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTestConnection = async (instance: GitlabInstance) => {
    setTestingConnections(prev => new Set(prev).add(instance.id));

    try {
      const result = await gitlabApiService.testInstanceConnection(instance);

      if (result.success) {
        toast({
          title: 'Connection successful',
          description: `Successfully connected to ${instance.name}. ${result.details?.version ? `Version: ${result.details.version}` : ''}`,
        });
      } else {
        toast({
          title: 'Connection failed',
          description: result.error || 'Failed to connect to GitLab instance.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Connection test failed',
        description: 'An unexpected error occurred while testing the connection.',
        variant: 'destructive',
      });
    } finally {
      setTestingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(instance.id);
        return newSet;
      });
    }
  };

  const toggleShowToken = (instanceId: string) => {
    setShowToken(prev => ({
      ...prev,
      [instanceId]: !prev[instanceId],
    }));
  };

  const getStatusIcon = (status: GitlabInstance['connectionStatus']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: GitlabInstance['connectionStatus']) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      case 'checking':
        return 'Checking...';
      default:
        return 'Disconnected';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner text="Loading GitLab instances..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">GitLab Instances</h2>
          <p className="text-muted-foreground">
            Configure and manage your GitLab instance connections
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingInstance(null);
              reset();
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Instance
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingInstance ? 'Edit GitLab Instance' : 'Add GitLab Instance'}
              </DialogTitle>
              <DialogDescription>
                {editingInstance
                  ? 'Update your GitLab instance configuration.'
                  : 'Configure a new GitLab instance to monitor your projects.'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(editingInstance ? handleUpdateInstance : handleAddInstance)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Instance Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., GitLab.com, Self-hosted GitLab"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">GitLab URL</Label>
                <Input
                  id="url"
                  placeholder="https://gitlab.com or https://gitlab.example.com"
                  {...register('url')}
                />
                {errors.url && (
                  <p className="text-sm text-red-500">{errors.url.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Personal Access Token</Label>
                <div className="relative">
                  <Input
                    id="token"
                    type="password"
                    placeholder="Enter your GitLab personal access token"
                    {...register('token')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowToken(prev => ({ ...prev, form: !prev.form }))}
                  >
                    {showToken.form ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.token && (
                  <p className="text-sm text-red-500">{errors.token.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Token must have 'read_api' and 'read_repository' scopes.
                  <a
                    href="https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline ml-1"
                  >
                    Learn more <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this GitLab instance"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingInstance(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingInstance ? 'Update Instance' : 'Add Instance'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Instances List */}
      {instances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No GitLab instances configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first GitLab instance to start monitoring your projects.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Instance
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(instance.connectionStatus)}
                      <CardTitle className="text-lg">{instance.name}</CardTitle>
                    </div>
                    <Badge variant={instance.isActive ? 'default' : 'secondary'}>
                      {instance.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(instance)}
                      disabled={testingConnections.has(instance.id)}
                    >
                      {testingConnections.has(instance.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditInstance(instance)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove GitLab Instance</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{instance.name}"? This will also remove all associated tokens and project selections. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteInstance(instance.id, instance.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove Instance
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <CardDescription className="flex items-center justify-between">
                  <span>{instance.url}</span>
                  <span className="text-xs">
                    {getStatusText(instance.connectionStatus)}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {instance.description && (
                    <p className="text-sm text-muted-foreground">{instance.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <span>Projects: {instance.selectedProjects.length}</span>
                      <span>API Version: {instance.apiVersion}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`active-${instance.id}`} className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id={`active-${instance.id}`}
                        checked={instance.isActive}
                        onCheckedChange={(checked) => handleToggleActive(instance.id, checked)}
                      />
                    </div>
                  </div>

                  {instance.errorMessage && (
                    <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">{instance.errorMessage}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GitlabSetup;
