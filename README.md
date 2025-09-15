# GitLab DashWatch

A comprehensive GitLab monitoring and management dashboard built with React, TypeScript, and modern web technologies. Monitor multiple GitLab instances, track project activity, manage webhooks, and optimize performance with real-time analytics and insights.

## 🚀 Features

### Core Functionality
- **Multi-Instance Support**: Monitor multiple GitLab instances simultaneously
- **Real-time Monitoring**: Live updates via webhooks and polling
- **Project Activity Tracking**: Comprehensive activity monitoring and analytics
- **Performance Optimization**: Advanced performance monitoring and recommendations
- **Secure Token Management**: Encrypted storage with Web Crypto API
- **Advanced Search & Filtering**: Full-text search with faceted filtering
- **Caching & Rate Limiting**: Intelligent caching and API rate limit management
- **Error Handling & Recovery**: Circuit breaker pattern with automatic retry logic

### Dashboard & Analytics
- **Interactive Dashboard**: Real-time metrics and health monitoring
- **Activity Insights**: Trend analysis and contributor analytics
- **Performance Benchmarking**: Baseline comparison and optimization tracking
- **Alert System**: Configurable alerts with severity levels
- **Export Functionality**: JSON/CSV export for all data types
- **Responsive Design**: Mobile-friendly interface with dark/light themes

### Developer Experience
- **TypeScript**: Full type safety with comprehensive interfaces
- **Modern UI**: Built with React, Tailwind CSS, and shadcn/ui
- **Testing**: Comprehensive test suite with Vitest and React Testing Library
- **Documentation**: Extensive inline documentation and guides
- **Performance**: Optimized with lazy loading and code splitting

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- GitLab instance(s) with API access
- Personal Access Token with appropriate permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gitlab-dashwatch.git
   cd gitlab-dashwatch
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Application Configuration
VITE_APP_TITLE="GitLab DashWatch"
VITE_APP_VERSION="1.0.0"
VITE_APP_ENV="development"

# GitLab Configuration
VITE_GITLAB_DEFAULT_URL="https://gitlab.com"
VITE_GITLAB_API_VERSION="v4"
VITE_GITLAB_REQUEST_TIMEOUT=30000

# Security Configuration
VITE_ENCRYPTION_KEY="your-32-character-encryption-key"
VITE_TOKEN_ROTATION_DAYS=90

# Performance Configuration
VITE_CACHE_TTL_MINUTES=60
VITE_RATE_LIMIT_REQUESTS_PER_HOUR=1000
VITE_MAX_CONCURRENT_REQUESTS=10

# Monitoring Configuration
VITE_ENABLE_REAL_TIME_UPDATES=true
VITE_POLLING_INTERVAL_SECONDS=300
VITE_ENABLE_WEBHOOKS=true
VITE_WEBHOOK_SECRET="your-webhook-secret"

# UI Configuration
VITE_DEFAULT_THEME="system"
VITE_ENABLE_ANIMATIONS=true
VITE_ITEMS_PER_PAGE=25
```

### GitLab Permissions

Your Personal Access Token needs the following scopes:
- `api` - Full API access
- `read_user` - Read user information
- `read_repository` - Read repository information
- `read_registry` - Read container registry information (optional)

## 📖 Usage

### Adding GitLab Instances

1. Navigate to Settings → GitLab Instances
2. Click "Add Instance"
3. Enter your GitLab instance details:
   - Instance Name
   - GitLab URL
   - Personal Access Token
4. Test the connection
5. Save the configuration

### Monitoring Projects

1. Go to the Projects page
2. Select your GitLab instance
3. Browse and filter projects
4. View detailed project information
5. Monitor activity and performance

### Setting Up Webhooks

1. In your GitLab instance, go to Project Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/gitlab`
3. Select events to monitor
4. Set the webhook secret
5. Test the webhook

### Performance Monitoring

1. Access the Performance Dashboard
2. View real-time metrics
3. Set up alerts and thresholds
4. Run performance benchmarks
5. Review optimization recommendations

## 🔧 API Documentation

### Core Services

#### GitlabApiService
Main service for GitLab API interactions.

```typescript
import { gitlabApiService } from '@/services/monitoring/gitlabApiService';

// Get projects
const projects = await gitlabApiService.getProjects(instanceId, options);

// Get project details
const project = await gitlabApiService.getProject(instanceId, projectId);

// Search projects
const results = await gitlabApiService.searchProjects(instanceId, query, filters);
```

#### GitlabActivityService
Activity monitoring and analytics.

```typescript
import { gitlabActivityService } from '@/services/monitoring/gitlabActivityService';

// Record activity
await gitlabActivityService.recordActivity(projectId, instanceId, activityData);

// Get activities
const activities = gitlabActivityService.getActivities(projectId, instanceId, filters);

// Get activity summary
const summary = gitlabActivityService.getActivitySummary(projectId, instanceId, period);
```

#### GitlabPerformanceService
Performance monitoring and optimization.

```typescript
import { gitlabPerformanceService } from '@/services/monitoring/gitlabPerformanceService';

// Record metrics
await gitlabPerformanceService.recordMetrics(instanceId, metrics);

// Get current metrics
const metrics = gitlabPerformanceService.getCurrentMetrics(instanceId);

// Run benchmark
const benchmark = await gitlabPerformanceService.runBenchmark(instanceId, 'baseline');
```

### Webhook Integration

#### Webhook Endpoints

```
POST /api/webhooks/gitlab/:instanceId
Content-Type: application/json
X-Gitlab-Event: Push Hook
X-Gitlab-Token: your-webhook-secret

{
  "object_kind": "push",
  "project": { "id": 123, "name": "my-project" },
  "commits": [...],
  "user_name": "john.doe"
}
```

#### Webhook Events Supported

- Push events
- Merge request events
- Issue events
- Pipeline events
- Release events
- Wiki page events
- Project events
- Member events

## 🐛 Troubleshooting

### Common Issues

#### Connection Issues

**Problem**: Unable to connect to GitLab instance
```
Error: Failed to fetch from https://gitlab.example.com/api/v4/projects
```

**Solutions**:
1. Verify GitLab URL is correct
2. Check network connectivity
3. Ensure Personal Access Token is valid
4. Verify token permissions
5. Check firewall/proxy settings

#### Authentication Errors

**Problem**: 401 Unauthorized
```
Error: Authentication failed
```

**Solutions**:
1. Regenerate Personal Access Token
2. Ensure token has required scopes
3. Check token expiration
4. Verify token format

#### Rate Limiting

**Problem**: 429 Too Many Requests
```
Error: API rate limit exceeded
```

**Solutions**:
1. Increase rate limit buffer in configuration
2. Implement request queuing
3. Use caching to reduce API calls
4. Consider upgrading GitLab plan

#### Webhook Issues

**Problem**: Webhooks not triggering
```
Webhook delivery failed
```

**Solutions**:
1. Verify webhook URL is accessible
2. Check webhook secret matches
3. Ensure SSL certificate is valid
4. Review GitLab webhook logs
5. Test webhook manually

### Performance Issues

#### High Memory Usage
- Reduce cache size
- Implement garbage collection
- Monitor memory leaks
- Scale application resources

#### Slow Response Times
- Enable caching
- Optimize database queries
- Implement lazy loading
- Use CDN for static assets

#### High CPU Usage
- Profile application performance
- Optimize algorithms
- Implement load balancing
- Scale horizontally

### Debug Mode

Enable debug logging:

```env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

View logs in browser console or check the logs directory.

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Update documentation
7. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write comprehensive tests
- Add JSDoc comments for public APIs

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Building

```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze
```

## 📚 Architecture

### Service Layer Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Components    │    │    Services     │    │   External APIs │
│                 │    │                 │    │                 │
│ • Dashboard     │◄──►│ • GitlabApi     │◄──►│ • GitLab API    │
│ • Project Cards │    │ • Activity      │    │ • Webhooks      │
│ • Settings      │    │ • Performance   │    │ • Cache         │
│ • Monitoring    │    │ • Caching       │    │ • Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **User Interaction** → Component
2. **Component** → Service Layer
3. **Service** → API Client
4. **API Client** → GitLab API
5. **Response** → Service Processing
6. **Processed Data** → Component
7. **Component** → UI Update

### State Management

- **Local State**: React useState/useReducer for component state
- **Global State**: React Context for application-wide state
- **Persistent State**: LocalStorage for user preferences
- **Server State**: React Query for API data caching

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [GitLab](https://gitlab.com) for their excellent API
- [React](https://reactjs.org) for the UI framework
- [Tailwind CSS](https://tailwindcss.com) for styling
- [shadcn/ui](https://ui.shadcn.com) for UI components
- [Vite](https://vitejs.dev) for the build tool

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/gitlab-dashwatch/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/gitlab-dashwatch/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/gitlab-dashwatch/wiki)

---

Built with ❤️ using modern web technologies
