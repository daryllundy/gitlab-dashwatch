import React, { useState, useEffect } from 'react';
import { GitBranch, Gitlab, GitPullRequest, Settings, ExternalLink } from 'lucide-react';
import { StatusCard } from '@/components/features/dashboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { LoadingSpinner } from '@/components/common';
import type { GitlabProject } from '@/types';
import { ROUTES } from '@/constants';
import { config } from '@/config';

const GitlabSection = () => {
  const [gitlabProjects, setGitlabProjects] = useState<GitlabProject[]>([]);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, isLoading } = useSettings();

  // Mock API call to fetch projects
  useEffect(() => {
    // This would be replaced with real API calls to GitLab instances using the tokens
    const fetchProjects = async () => {
      try {
        // In a real implementation, we would use the tokens for authentication
        // const instancesWithTokens = settings.gitlab.instances.filter(instance => instance.token);
        
        // For demo purposes, we'll use mock data but log attempted API calls
        settings.gitlab.instances.forEach(instance => {
          if (instance.token) {
            console.log(`Would fetch projects from ${instance.url} using token: ${instance.token.substring(0, 4)}...`);
          } else {
            console.log(`Would fetch public projects from ${instance.url} (no token provided)`);
          }
        });
        
        // Mock data
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
            instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
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
            instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
          },
          {
            id: 3,
            name: 'Infrastructure',
            description: 'Terraform scripts',
            status: 'healthy',
            openIssues: 2,
            branches: 2,
            pullRequests: 0,
            lastCommit: '1d ago',
            instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
          },
          {
            id: 4,
            name: 'Mobile App',
            description: 'iOS & Android',
            status: 'inactive',
            openIssues: 0,
            branches: 1,
            pullRequests: 0,
            lastCommit: '30d ago',
            instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
          },
          {
            id: 5,
            name: 'Documentation',
            description: 'Project docs',
            status: 'healthy',
            openIssues: 3,
            branches: 1,
            pullRequests: 1,
            lastCommit: '5h ago',
            instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
          },
          {
            id: 6,
            name: 'Database Migrations',
            description: 'SQL migrations',
            status: 'warning',
            openIssues: 7,
            branches: 2,
            pullRequests: 2,
            lastCommit: '1d ago',
            instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
          },
          {
            id: 7,
            name: 'Design System',
            description: 'UI component library',
            status: 'healthy',
            openIssues: 4,
            branches: 3,
            pullRequests: 1,
            lastCommit: '3d ago',
            instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
          },
          {
            id: 8,
            name: 'Testing Framework',
            description: 'E2E and unit tests',
            status: 'healthy',
            openIssues: 2,
            branches: 1,
            pullRequests: 0,
            lastCommit: '2d ago',
            instanceUrl: settings.gitlab.instances.length > 0 ? settings.gitlab.instances[0].url : 'https://gitlab.example.com',
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch GitLab projects:', error);
        toast({
          title: "Error fetching projects",
          description: "Failed to connect to GitLab instances. Check your settings and connectivity.",
          variant: "destructive",
        });
      }
    };

    if (settings.gitlab.instances.length > 0 && !isLoading) {
      fetchProjects();
    }
  }, [settings.gitlab.instances, isLoading, toast]);

  const openProjectInGitlab = (project: GitlabProject) => {
    // Format: https://gitlab.example.com/project-name
    const projectName = project.name.toLowerCase().replace(/\s+/g, '-');
    const projectUrl = `${project.instanceUrl}/${projectName}`;
    window.open(projectUrl, '_blank');
  };

  const navigateToSettings = () => {
    navigate(ROUTES.SETTINGS);
  };

  const toggleViewAll = () => {
    setShowAllProjects(!showAllProjects);
  };

  // Display all projects or just the configured preview limit
  const displayProjects = showAllProjects ? gitlabProjects : gitlabProjects.slice(0, config.monitoring.display.maxProjectsPreview);

  if (isLoading) {
    return (
      <div className="section-appear" style={{ '--delay': config.ui.animation.delays.section } as React.CSSProperties}>
        <LoadingSpinner text="Loading GitLab configuration..." />
      </div>
    );
  }

  return (
    <div className="section-appear" style={{ '--delay': config.ui.animation.delays.section } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">GitLab Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Status of your self-hosted projects ({settings.gitlab.instances.length} instances configured)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-primary flex items-center gap-1"
            onClick={navigateToSettings}
          >
            <Settings className="h-4 w-4" />
            Configure
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-sm font-medium text-primary flex items-center gap-1"
            onClick={toggleViewAll}
          >
            <ExternalLink className="h-4 w-4" />
            {showAllProjects ? "Show Less" : "View All"}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayProjects.map((project, index) => (
          <StatusCard
            key={project.id}
            title={project.name}
            subtitle={project.description}
            icon={Gitlab}
            status={project.status as any}
            className="card-appear"
            style={{ '--delay': index + 1 } as React.CSSProperties}
            onClick={() => openProjectInGitlab(project)}
          >
            <div className="pt-2 mt-2 border-t border-border">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span>{project.openIssues}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3 text-muted-foreground" />
                  <span>{project.branches}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GitPullRequest className="h-3 w-3 text-muted-foreground" />
                  <span>{project.pullRequests}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Last commit: {project.lastCommit}
              </div>
            </div>
          </StatusCard>
        ))}
      </div>
      
      {gitlabProjects.length > 4 && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={toggleViewAll}
            className="w-full max-w-xs"
          >
            {showAllProjects ? "Show Less" : `View ${gitlabProjects.length - 4} More Projects`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default GitlabSection;
