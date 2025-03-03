
import React, { useState, useEffect } from 'react';
import { GitBranch, Gitlab, GitPullRequest, Settings } from 'lucide-react';
import StatusCard from './StatusCard';
import { useNavigate } from 'react-router-dom';

const GitlabSection = () => {
  const [gitlabProjects, setGitlabProjects] = useState([]);
  const [gitlabInstances, setGitlabInstances] = useState([]);
  const navigate = useNavigate();

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('dashboardSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.gitlab && settings.gitlab.instances) {
          setGitlabInstances(settings.gitlab.instances);
        }
      } catch (e) {
        console.error('Failed to parse settings from localStorage:', e);
      }
    }
  }, []);

  // Default mock data if no real data is available
  useEffect(() => {
    // This would be replaced with real API calls to GitLab instances
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
        instanceUrl: gitlabInstances.length > 0 ? gitlabInstances[0].url : 'https://gitlab.example.com',
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
        instanceUrl: gitlabInstances.length > 0 ? gitlabInstances[0].url : 'https://gitlab.example.com',
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
        instanceUrl: gitlabInstances.length > 0 ? gitlabInstances[0].url : 'https://gitlab.example.com',
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
        instanceUrl: gitlabInstances.length > 0 ? gitlabInstances[0].url : 'https://gitlab.example.com',
      },
    ]);
  }, [gitlabInstances]);

  const openProjectInGitlab = (project) => {
    // Format: https://gitlab.example.com/project-name
    const projectName = project.name.toLowerCase().replace(/\s+/g, '-');
    const projectUrl = `${project.instanceUrl}/${projectName}`;
    window.open(projectUrl, '_blank');
  };

  const navigateToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="section-appear" style={{ '--delay': 1 } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">GitLab Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Status of your self-hosted projects ({gitlabInstances.length} instances configured)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            onClick={navigateToSettings}
          >
            <Settings className="h-4 w-4" />
            Configure
          </button>
          <button className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
            <Gitlab className="h-4 w-4" />
            View All
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gitlabProjects.map((project, index) => (
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
    </div>
  );
};

export default GitlabSection;
