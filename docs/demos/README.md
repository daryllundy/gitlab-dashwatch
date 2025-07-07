# Asciinema Demo Recordings

This directory contains asciinema recordings demonstrating various aspects of GitLab DashWatch.

## Available Demos

### 1. Quick Start Demo (`quick-start-demo.cast`)
**Duration**: ~38 seconds  
**Description**: Complete setup from cloning the repository to running the application with Docker  
**Shows**: 
- Repository cloning
- Environment setup
- Docker Compose build and run
- Application startup

### 2. Authentication Flow Demo (`auth-flow-demo.cast`)
**Duration**: ~42 seconds  
**Description**: Overview of authentication features and user flow  
**Shows**:
- Authentication methods available
- Supabase configuration
- User interface flow
- Guest mode warnings

### 3. Docker Development Workflow (`docker-dev-workflow.cast`)
**Duration**: ~44 seconds  
**Description**: Development environment setup with hot reload and testing  
**Shows**:
- Development container startup
- Hot reload functionality  
- Running tests independently
- Type checking

### 4. Production Deployment Demo (`production-deploy-demo.cast`)
**Duration**: ~60 seconds  
**Description**: Building and deploying optimized production container  
**Shows**:
- Production build with environment variables
- Multi-stage Docker build
- Container health checks
- Size optimization results

## Playing Demo Files

### Using asciinema player
```bash
# Install asciinema
npm install -g asciinema

# Play a demo
asciinema play docs/demos/quick-start-demo.cast
```

### Embedding in Documentation
These `.cast` files can be:
- Played locally with asciinema
- Uploaded to asciinema.org for web embedding
- Converted to GIF using asciicast2gif
- Embedded in web pages using asciinema-player

### Converting to Other Formats
```bash
# Convert to GIF (requires asciicast2gif)
asciicast2gif docs/demos/quick-start-demo.cast quick-start-demo.gif

# Convert to SVG (using asciinema web service)
curl -u user:token https://asciinema.org/api/asciicasts -F asciicast=@docs/demos/quick-start-demo.cast
```

## Recording New Demos

To record new demonstrations:

```bash
# Start recording
asciinema rec new-demo.cast

# Perform your demonstration
# ...

# Stop recording with Ctrl+C

# Review the recording
asciinema play new-demo.cast
```

### Recording Guidelines

1. **Keep it concise**: Aim for 30-60 seconds per demo
2. **Clear commands**: Type commands clearly with brief explanations
3. **Wait for completion**: Allow commands to complete before proceeding
4. **Show results**: Display successful outcomes
5. **Use realistic data**: Include sample configurations where applicable

## Technical Details

- **Format**: Asciinema v2 JSON format
- **Terminal**: 120x30 character dimensions
- **Shell**: Bash with colored prompts
- **Encoding**: UTF-8 with ANSI escape sequences