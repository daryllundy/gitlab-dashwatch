import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout';
import { useSettings } from '@/contexts/SettingsContext';
import { 
  Gitlab, ArrowLeft, GitBranch, GitPullRequest, 
  AlertCircle, ExternalLink, RefreshCw, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/features/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const GitlabProjects = () => {
  const [gitlabProjects, setGitlabProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeInstance, setActiveInstance] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, refreshSettings } = useSettings();

  // Mock API call to fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        // This would be a real API call using the token
        console.log('Fetching GitLab projects...');
        
        // Log what would happen in a real implementation
        settings.gitlab.instances.forEach(instance => {
          if (instance.token) {
            console.log(`Would fetch projects from ${instance.url} using token: ${instance.token.substring(0, 4)}...`);
          } else {
            console.log(`Would fetch public projects from ${instance.url} (no token provided)`);
          }
        });
        
        // Mock data - in a real app, this would come from the API
        setTimeout(() => {
          setGitlabProjects([
            {
              id: 1,
              name: 'Backend API',
              description: 'Main backend service',
              status: 'healthy',
              openIssues: 5,
              branches: 3,
              pullRequests: 2,
              lastCommit: '2h ago',
              lastCommitter: 'John Doe',
              commitMsg: 'Fix authentication middleware',
              instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
              instanceName: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].name : 'Main GitLab',
            },
            {
              id: 2,
              name: 'Frontend App',
              description: 'User interface',
              status: 'warning',
              openIssues: 12,
              branches: 5,
              pullRequests: 3,
              lastCommit: '4h ago',
              lastCommitter: 'Jane Smith',
              commitMsg: 'Update dashboard UI components',
              instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
              instanceName: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].name : 'Main GitLab',
            },
          ]);
          setIsLoading(false);
        }, 1000); // Simulate loading delay
      } catch (error) {
        console.error('Failed to fetch GitLab projects:', error);
        toast({
          title: "Error fetching projects",
          description: "Failed to connect to GitLab instances. Check your settings and connectivity.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    if (settings.gitlab.instances.length > 0) {
      fetchProjects();
      
      if (settings.gitlab.instances.length > 0) {
        setActiveInstance(settings.gitlab.instances[0].url);
      }
    } else {
      setIsLoading(false);
    }
  }, [settings.gitlab.instances, toast]);

  const openProjectInGitlab = (project) => {
    const projectName = project.name.toLowerCase().replace(/\s+/g, '-');
    const projectUrl = `${project.instanceUrl}/${projectName}`;
    window.open(projectUrl, '_blank');
  };

  const refreshProjects = () => {
    if (settings.gitlab.instances.length > 0) {
      setIsLoading(true);
      // This would trigger a real API call in a real application
      setTimeout(() => {
        toast({
          title: "Projects refreshed",
          description: "GitLab projects have been updated.",
        });
        setIsLoading(false);
      }, 1000);
    } else {
      toast({
        title: "No GitLab instances",
        description: "Please configure GitLab instances in settings first.",
        variant: "destructive",
      });
    }
  };

  // Filter projects by active instance
  const filteredProjects = activeInstance === 'all' 
    ? gitlabProjects 
    : gitlabProjects.filter(project => project.instanceUrl === activeInstance);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">GitLab Projects</h1>
              <p className="text-muted-foreground">
                Manage and monitor your self-hosted GitLab repositories
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshProjects}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
        
        {settings.gitlab.instances.length === 0 ? (
          <Card className="my-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gitlab className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold">No GitLab Instances Configured</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                You haven't configured any GitLab instances yet. Add your self-hosted GitLab
                instances in the settings to start monitoring your projects.
              </p>
              <Button onClick={() => navigate('/settings')}>
                Configure GitLab
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs 
              value={activeInstance} 
              onValueChange={setActiveInstance} 
              className="my-4"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  All Instances
                </TabsTrigger>
                {settings.gitlab.instances.map((instance) => (
                  <TabsTrigger key={instance.url} value={instance.url}>
                    {instance.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeInstance} className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No projects found</h3>
                    <p className="text-muted-foreground">
                      No GitLab projects found for the selected instance.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProjects.map((project) => (
                      <Card key={project.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <div className="flex items-start gap-2">
                            <StatusIndicator status={project.status} className="mt-1.5" />
                            <div>
                              <CardTitle className="text-lg">{project.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{project.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {project.instanceName}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openProjectInGitlab(project)}
                            className="rounded-full"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4 py-2">
                            <div className="flex flex-col items-center justify-center p-2 bg-muted rounded-md">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-destructive" />
                                <span className="font-medium">{project.openIssues}</span>
                              </div>
                              <span className="text-xs text-muted-foreground mt-1">Issues</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 bg-muted rounded-md">
                              <div className="flex items-center gap-1">
                                <GitBranch className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{project.branches}</span>
                              </div>
                              <span className="text-xs text-muted-foreground mt-1">Branches</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 bg-muted rounded-md">
                              <div className="flex items-center gap-1">
                                <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{project.pullRequests}</span>
                              </div>
                              <span className="text-xs text-muted-foreground mt-1">PRs</span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">Latest commit</span>
                              <p className="text-sm truncate">{project.commitMsg}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-muted-foreground">by {project.lastCommitter}</span>
                                <span className="text-xs text-muted-foreground">{project.lastCommit}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default GitlabProjects;
