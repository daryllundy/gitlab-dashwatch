# GitLab DashWatch - Demo Overview

This document provides a comprehensive overview of all available demo recordings for GitLab DashWatch.

## Demo Files Summary

| Demo | File | Duration | Description | Key Features Shown |
|------|------|----------|-------------|-------------------|
| **Quick Start** | `quick-start-demo.cast` | ~38s | Complete setup from clone to running | Git clone, env setup, Docker build, startup |
| **Authentication** | `auth-flow-demo.cast` | ~42s | Authentication features overview | Supabase config, auth methods, UI flow |
| **Development** | `docker-dev-workflow.cast` | ~44s | Development environment workflow | Hot reload, testing, type checking |
| **Production** | `production-deploy-demo.cast` | ~60s | Production deployment process | Multi-stage build, optimization, health checks |

## Usage Instructions

### Prerequisites
```bash
# Install asciinema player
npm install -g asciinema
```

### Quick Demo Playback
```bash
# List available demos
npm run demos:play

# Play a specific demo
asciinema play docs/demos/quick-start-demo.cast
asciinema play docs/demos/auth-flow-demo.cast
asciinema play docs/demos/docker-dev-workflow.cast
asciinema play docs/demos/production-deploy-demo.cast
```

### Upload to asciinema.org
```bash
# Upload all demos
npm run demos:upload

# Or upload individually
asciinema upload docs/demos/quick-start-demo.cast
```

## Demo Content Breakdown

### 1. Quick Start Demo (`quick-start-demo.cast`)
**Target Audience**: New users, evaluators, quick setup  
**Scenario**: First-time user wants to try GitLab DashWatch  

**Timeline**:
- 0-10s: Repository cloning and initial exploration
- 10-15s: Environment variable configuration
- 15-30s: Docker Compose build process
- 30-38s: Application startup and success confirmation

**Commands Demonstrated**:
```bash
git clone https://github.com/daryllundy/gitlab-dashwatch.git
cd gitlab-dashwatch
cp .env.example .env
# Edit environment variables
docker-compose up --build
```

### 2. Authentication Flow Demo (`auth-flow-demo.cast`)
**Target Audience**: Users setting up authentication, security-conscious users  
**Scenario**: Understanding authentication capabilities and setup  

**Timeline**:
- 0-15s: Authentication features overview
- 15-25s: Supabase configuration display
- 25-35s: UI flow explanation
- 35-42s: Guest mode warnings and limitations

**Key Concepts Covered**:
- Email/password authentication
- GitHub OAuth integration
- Persistent settings storage
- Session management
- Guest mode limitations

### 3. Docker Development Workflow (`docker-dev-workflow.cast`)
**Target Audience**: Developers, contributors, development team  
**Scenario**: Setting up a development environment with hot reload  

**Timeline**:
- 0-10s: Available npm scripts overview
- 10-25s: Development container build and startup
- 25-35s: Testing and type checking
- 35-44s: Development features summary

**Development Features**:
- Hot reload with file watching
- Independent test execution
- TypeScript checking
- Volume mounting for live updates

### 4. Production Deployment Demo (`production-deploy-demo.cast`)
**Target Audience**: DevOps, system administrators, production deployment  
**Scenario**: Building and deploying optimized production container  

**Timeline**:
- 0-15s: Environment verification and build preparation
- 15-40s: Multi-stage Docker build process
- 40-50s: Container deployment and health verification
- 50-60s: Performance metrics and optimization results

**Production Features**:
- Multi-stage build optimization
- Environment variable injection at build time
- Nginx serving with health checks
- Container size optimization (45.2MB)

## Technical Specifications

### Recording Settings
- **Format**: Asciinema v2 JSON
- **Dimensions**: 120x30 characters
- **Shell**: Bash with colored prompts
- **Terminal**: xterm-256color
- **Encoding**: UTF-8 with ANSI escape sequences

### File Structure
```
docs/demos/
├── README.md                    # Detailed demo documentation
├── demo-overview.md            # This overview file
├── quick-start-demo.cast       # Quick setup demonstration
├── auth-flow-demo.cast         # Authentication overview
├── docker-dev-workflow.cast    # Development workflow
└── production-deploy-demo.cast # Production deployment
```

## Integration Options

### Web Embedding
These demo files can be embedded in web pages using:
- [asciinema-player](https://github.com/asciinema/asciinema-player)
- Direct upload to asciinema.org for iframe embedding
- Conversion to GIF format for universal compatibility

### Documentation Integration
- Embed in README.md using asciinema links
- Include in project wikis and documentation sites
- Use in presentations and training materials

### CI/CD Integration
- Automated demo updates when features change
- Integration testing with recorded scenarios
- Documentation verification against actual behavior

## Maintenance

### Updating Demos
When updating demos, ensure:
1. Commands reflect current project structure
2. Output matches current application behavior
3. Timing allows for command completion
4. Error handling demonstrates robust failure modes

### Best Practices
- Keep demos focused and concise
- Use realistic example data
- Show both success and error scenarios where appropriate
- Maintain consistent terminal styling across recordings