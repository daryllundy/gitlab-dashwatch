# GitLab DashWatch 📊

[![React](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker Hub](https://img.shields.io/badge/docker-hub-blue.svg)](https://hub.docker.com/r/dbdaryl/gitlab-dashwatch)
[![GitLab Mirror](https://img.shields.io/badge/gitlab-mirror-orange.svg)](https://gitlab.com/daryllundy/gitlab-dashwatch)

A self-hosted monitoring dashboard for GitLab instances, servers, DNS domains, and website uptime. Built with React, TypeScript, and Tailwind CSS.

## Project History

This project was originally created using [Lovable.dev](https://lovable.dev) - an AI-powered development platform that accelerates web application development. The initial prototype was built through Lovable's intuitive prompting interface, which generated a fully functional React application with modern best practices.

The project has since been **completely refactored and enhanced** to run anywhere:
- ✅ Migrated from Lovable.dev's hosted environment to self-hosted deployment
- ✅ Added Docker containerization for universal deployment
- ✅ Implemented comprehensive TypeScript typing and error handling
- ✅ Organized codebase according to industry best practices
- ✅ Added extensive testing suite and CI/CD capabilities
- ✅ Enhanced with production-ready features and documentation

While Lovable.dev provided an excellent foundation for rapid prototyping, this version represents a production-ready application suitable for enterprise deployment.

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
# Build the image with environment variables
docker build \
  --build-arg VITE_SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2) \
  --build-arg VITE_SUPABASE_ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2) \
  -t gitlab-dashwatch .

# Run the container
docker run -p 3000:80 gitlab-dashwatch
```

### Option 3: Use Pre-built Docker Image

Pull and run the pre-built image from Docker Hub:

```sh
# Pull the latest image
docker pull dbdaryl/gitlab-dashwatch:latest

# Run with environment variables
docker run -p 3000:80 \
  --build-arg VITE_SUPABASE_URL=your-supabase-url \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
  dbdaryl/gitlab-dashwatch:latest
```

**Note**: For production deployments, environment variables must be provided at build time since this is a static React application.

### Option 4: Deploy to Hosting Provider

The Docker container can be deployed to any hosting provider that supports Docker:

- **DigitalOcean App Platform**: Push to GitHub/GitLab and deploy directly
- **Railway**: Connect repository and deploy with automatic builds
- **Fly.io**: Use `flyctl` to deploy the Docker container
- **Heroku**: Use Container Registry for Docker deployments
- **AWS ECS/Fargate**: Deploy using AWS container services
- **Google Cloud Run**: Deploy serverless containers

**Docker Hub**: `dbdaryl/gitlab-dashwatch:latest`

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

- 🔍 Monitor multiple GitLab instances with API integration
- 📊 Track website uptime and response times
- 🌐 DNS domain monitoring with record type checking
- 🖥️ Server monitoring with Netdata integration
- 🔐 User authentication and settings persistence via Supabase
- 🎨 Responsive design with dark/light theme support
- 🐳 Docker containerization for easy deployment
- ✅ Comprehensive testing suite
- 📈 Production-ready with error handling and monitoring
- 🔑 OAuth integration (GitHub) for seamless sign-in

## Testing

This project includes a comprehensive test suite:

```sh
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking and linting
npm run check

# Validate environment configuration
npm run validate:env
```

### Environment Configuration Validation

The project includes automated validation to ensure the `.env.example` file stays in sync with code requirements:

```sh
# Validate .env.example completeness and documentation
npm run validate:env

# Run validation as part of the full check suite
npm run check
```

The validation checks:
- ✅ All required environment variables are documented
- ✅ Account configuration examples are provided
- ✅ Security best practices are documented
- ✅ Use case examples are included
- ✅ Variable naming consistency is maintained

## Authentication Setup

GitLab DashWatch uses [Supabase](https://supabase.com) for user authentication and settings persistence. To set up authentication:

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key from the API settings

2. **Configure Environment Variables**:
   ```sh
   # Copy the environment template
   cp .env.example .env
   
   # Edit .env with your Supabase credentials
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Authentication Features**:
   - 📧 Email/password authentication
   - 🔗 GitHub OAuth integration
   - 💾 Persistent settings storage per user
   - 🔒 Secure session management
   - ⚠️ Guest mode with local-only settings

**Important**: Without authentication, settings are stored locally and will be lost when the browser data is cleared.

## Docker Configuration

### Building with Environment Variables

For production deployments, environment variables must be provided at **build time**:

```sh
# Method 1: Using docker build with args
docker build \
  --build-arg VITE_SUPABASE_URL=your-supabase-url \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key \
  -t gitlab-dashwatch .

# Method 2: Using docker-compose with .env file
docker-compose up --build
```

### Development vs Production

- **Development**: Uses `Dockerfile.dev` with hot reload and volume mounting
- **Production**: Uses multi-stage build with optimized Nginx serving

## Quick Start with Docker

The fastest way to get started:

```sh
# 1. Clone and configure
git clone https://github.com/daryllundy/gitlab-dashwatch.git
cd gitlab-dashwatch
cp .env.example .env
# Edit .env with your Supabase credentials

# 2. Build and run with Docker Compose
docker-compose up --build

# 3. Visit http://localhost:3000

# 4. Sign in to save settings permanently
```

## Screenshots

### Dashboard Overview
![Dashboard Overview](docs/screenshots/dashboard-overview.png)
*Main dashboard showing monitoring status for GitLab instances, websites, DNS, and servers*

### Authentication
![Sign In Dialog](docs/screenshots/auth-dialog.png)
*User authentication with email/password and GitHub OAuth*

![User Menu](docs/screenshots/user-menu.png)
*Authenticated user menu with settings and logout options*

### Settings Configuration
![GitLab Settings](docs/screenshots/settings-gitlab.png)
*Configure multiple GitLab instances with API tokens*

![Website Monitoring](docs/screenshots/settings-uptime.png)
*Add websites for uptime monitoring*

![DNS Monitoring](docs/screenshots/settings-dns.png)
*Configure DNS domain monitoring with record types*

![Server Monitoring](docs/screenshots/settings-servers.png)
*Set up server monitoring with Netdata integration*

### Theme Support
![Dark Mode](docs/screenshots/dark-mode.png)
*Dark theme support for better visibility*

![Light Mode](docs/screenshots/light-mode.png)
*Light theme with clean, professional design*

### Authentication Warning
![Auth Warning](docs/screenshots/auth-warning.png)
*Warning banner for unauthenticated users about temporary settings storage*

## Video Demos

Interactive terminal demonstrations showing GitLab DashWatch setup and deployment workflows.

### Quick Start Demo
[![asciicast](https://asciinema.org/a/XiEIrtP1XjFUnOD8hiXE21xSN.svg)](https://asciinema.org/a/XiEIrtP1XjFUnOD8hiXE21xSN)
*Complete setup from clone to running application with Docker (~38 seconds)*

### Authentication Flow Demo  
[![asciicast](https://asciinema.org/a/U1CUP8TS7PU2olD09LwuHXgrh.svg)](https://asciinema.org/a/U1CUP8TS7PU2olD09LwuHXgrh)
*User registration, login, and settings persistence demonstration (~42 seconds)*

### Docker Development Workflow
[![asciicast](https://asciinema.org/a/gVas8of05Pgi8iM0mGGanLnAE.svg)](https://asciinema.org/a/gVas8of05Pgi8iM0mGGanLnAE)
*Development environment setup with hot reload and testing (~44 seconds)*

### Production Deployment Demo
[![asciicast](https://asciinema.org/a/xK6f3fdaWlaQEdt3HTnKwhmTh.svg)](https://asciinema.org/a/xK6f3fdaWlaQEdt3HTnKwhmTh)
*Building and deploying to production with environment configuration (~60 seconds)*

### Viewing Demos

#### Option 1: Click the embedded players above
Each demo includes an interactive asciinema player that you can click to play directly in this README.

#### Option 2: Play locally
```bash
# Install asciinema player
npm install -g asciinema

# List available demos
npm run demos:play

# Play any demo locally
asciinema play docs/demos/quick-start-demo.cast
asciinema play docs/demos/auth-flow-demo.cast
asciinema play docs/demos/docker-dev-workflow.cast
asciinema play docs/demos/production-deploy-demo.cast
```

#### Option 3: Open in asciinema.org
- [Quick Start Demo](https://asciinema.org/a/XiEIrtP1XjFUnOD8hiXE21xSN)
- [Authentication Flow Demo](https://asciinema.org/a/U1CUP8TS7PU2olD09LwuHXgrh)
- [Docker Development Workflow](https://asciinema.org/a/gVas8of05Pgi8iM0mGGanLnAE)
- [Production Deployment Demo](https://asciinema.org/a/xK6f3fdaWlaQEdt3HTnKwhmTh)

📁 **Local Files**: All demo recordings are available in [`docs/demos/`](docs/demos/) directory.  
📚 **Documentation**: See [`docs/demos/README.md`](docs/demos/README.md) for detailed information.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. **Fork and clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment**: `cp .env.example .env` and configure Supabase
4. **Start development server**: `npm run dev`
5. **Run tests**: `npm test`
6. **Submit a pull request**

### Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── common/       # Common components (ErrorBoundary, Loading)
│   └── ui/           # shadcn/ui components
├── contexts/         # React contexts (Auth, Settings)
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── services/         # API services and utilities
├── types/            # TypeScript type definitions
├── config/           # Configuration files
└── constants/        # Application constants
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Bug Reports**: [Create an issue](https://github.com/daryllundy/gitlab-dashwatch/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/daryllundy/gitlab-dashwatch/discussions)
- 📚 **Documentation**: Check the [docs](./docs) directory
- 💬 **Community**: Join our discussions on GitHub

## Acknowledgments

- Built with [Lovable.dev](https://lovable.dev) for rapid prototyping
- Powered by [Supabase](https://supabase.com) for authentication and data
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons by [Lucide](https://lucide.dev)
- Monitoring inspiration from GitLab's own monitoring tools
