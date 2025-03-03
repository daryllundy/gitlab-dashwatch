
import React from 'react';
import { GitBranch, Gitlab, GitPullRequest } from 'lucide-react';
import StatusCard from './StatusCard';

// Mock data
const gitlabProjects = [
  {
    id: 1,
    name: 'Backend API',
    description: 'Main backend service',
    status: 'healthy',
    openIssues: 5,
    branches: 3,
    pullRequests: 2,
    lastCommit: '2h ago',
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
  },
];

const GitlabSection = () => {
  return (
    <div className="section-appear" style={{ '--delay': 1 } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">GitLab Projects</h2>
          <p className="text-sm text-muted-foreground mt-1">Status of your self-hosted projects</p>
        </div>
        <button className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          <Gitlab className="h-4 w-4" />
          View All
        </button>
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
