# Distribution and Publishing Guide

This guide explains how to package and distribute the 508 Accessibility MCP Server.

## Pre-Publishing Checklist

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Test the built server:**
   ```bash
   node lib/src/index.js stdio
   ```

3. **Verify package contents:**
   ```bash
   npm pack --dry-run
   ```

## Publishing to npm

### 1. Login to npm
```bash
npm login
```

### 2. Publish the package
```bash
npm publish
```

### 3. Verify publication
```bash
npm view 508-accessibility-mcp-server
```

## Local Installation for Testing

### 1. Create a global link
```bash
npm link
```

### 2. Test the global installation
```bash
508-accessibility-mcp stdio
```

### 3. Unlink when done testing
```bash
npm unlink -g 508-accessibility-mcp-server
```

## Distribution Methods

### Option 1: npm Registry (Recommended)
- Users install with: `npm install -g 508-accessibility-mcp-server`
- Automatic updates available
- Easy dependency management

### Option 2: GitHub Releases
- Create releases with built artifacts
- Users download and install manually
- Good for internal distribution

### Option 3: Docker Container
- Create a containerized version
- Can be pulled and run in any environment
- Good for cloud deployments

## VS Code Integration

After publishing, users can integrate with VS Code by:

1. Installing the package: `npm install -g 508-accessibility-mcp-server`
2. Adding to MCP configuration:
   ```json
   {
     "servers": {
       "508-accessibility": {
         "type": "stdio",
         "command": "508-accessibility-mcp",
         "args": ["stdio"]
       }
     }
   }
   ```

## File Structure for Distribution

The published package includes:
- `lib/` - Compiled JavaScript files
- `README.md` - Documentation
- `LICENSE` - License file
- `package.json` - Package metadata
- `MCP_CONFIGURATION.md` - VS Code setup guide

Files excluded from distribution (via `.npmignore`):
- `src/` - TypeScript source files
- `test-*` files
- Development configuration files
- Build artifacts and temporary files

## Version Management

Update version before publishing:
```bash
npm version patch  # For bug fixes
npm version minor  # For new features
npm version major  # For breaking changes
```

## Support and Documentation

- Main documentation: `README.md`
- VS Code setup: `MCP_CONFIGURATION.md`
- API documentation: Generated from TypeScript declarations