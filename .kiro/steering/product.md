# Product Overview

GitLab DashWatch is a self-hosted monitoring dashboard for infrastructure and development operations. It provides centralized monitoring for:

- **GitLab Instances**: Monitor multiple GitLab servers, projects, issues, and repository activity
- **Website Uptime**: Track availability and response times for web services
- **DNS Monitoring**: Check domain records and DNS resolution
- **Server Health**: Integration with Netdata for system metrics

## Key Features

- Multi-tenant monitoring with user authentication via Supabase
- Responsive web interface with dark/light theme support
- Docker containerization for easy deployment
- Real-time status updates and health indicators
- Settings persistence with guest mode fallback

## Target Users

- DevOps engineers managing self-hosted GitLab instances
- System administrators monitoring infrastructure
- Development teams tracking project health
- Organizations requiring centralized monitoring dashboards

## Authentication & Data

- Uses Supabase for user authentication and settings storage
- Supports GitHub OAuth integration
- Guest mode with local storage for unauthenticated users
- Settings are user-specific and persist across sessions
