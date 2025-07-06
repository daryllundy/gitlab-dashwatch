# GitLab DashWatch

[![GitHub](https://img.shields.io/badge/GitHub-Primary-181717?logo=github)](https://github.com/daryllundy/gitlab-dashwatch) [![GitLab](https://img.shields.io/badge/GitLab-Mirror-FCA121?logo=gitlab)](https://gitlab.com/daryllundy/gitlab-dashwatch)

A self-hosted monitoring dashboard for GitLab instances, servers, DNS domains, and website uptime. Built with React, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js 18+ and npm (for local development)
- Docker and Docker Compose (for containerized deployment)
- Supabase account and project for data persistence

## Environment Configuration

1. Copy the environment template:
   ```sh
   cp .env.example .env
   ```

2. Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Local Development

### Option 1: Direct Node.js

```sh
# Clone the repository
git clone https://github.com/daryllundy/gitlab-dashwatch.git
cd gitlab-dashwatch

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Option 2: Docker Development Environment

```sh
# Run development environment with hot reload
npm run docker:dev

# Or using docker-compose directly
docker-compose --profile dev up
```

The application will be available at `http://localhost:8080`

## Production Deployment

### Option 1: Docker Container

```sh
# Build and run production container
npm run docker:build
npm run docker:run

# Or using docker-compose
npm run docker:prod
```

The application will be available at `http://localhost:3000`

### Option 2: Manual Docker Commands

```sh
# Build the image
docker build -t gitlab-dashwatch .

# Run the container
docker run -p 3000:80 --env-file .env gitlab-dashwatch
```

### Option 3: Deploy to Hosting Provider

The Docker container can be deployed to any hosting provider that supports Docker:

- **DigitalOcean App Platform**: Push to GitHub/GitLab and deploy directly
- **Railway**: Connect repository and deploy with automatic builds
- **Fly.io**: Use `flyctl` to deploy the Docker container
- **Heroku**: Use Container Registry for Docker deployments
- **AWS ECS/Fargate**: Deploy using AWS container services
- **Google Cloud Run**: Deploy serverless containers

## Docker Management Commands

```sh
# Stop all containers
npm run docker:stop

# Clean up containers, volumes, and images
npm run docker:clean

# View logs
docker-compose logs -f
```

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS
- **State Management**: React Context + TanStack Query
- **Backend**: Supabase (Database + Authentication)
- **Routing**: React Router v6
- **Deployment**: Docker + Nginx

## Features

- Monitor multiple GitLab instances with API integration
- Track website uptime and response times
- DNS domain monitoring with record type checking
- Server monitoring with Netdata integration
- User authentication and settings persistence
- Responsive design with dark/light theme support
