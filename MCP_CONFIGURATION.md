# MCP Configuration for VS Code

This document explains how to configure the 508 Accessibility MCP Server for use with VS Code.

## Installation

1. **Install globally via npm:**
   ```bash
   npm install -g 508-accessibility-mcp-server
   ```

2. **Or install locally in your project:**
   ```bash
   npm install 508-accessibility-mcp-server
   ```

## VS Code Configuration

### Option 1: Using AI Toolkit Extension

If you have the AI Toolkit extension installed:

1. Open VS Code
2. Go to the AI Toolkit extension
3. Add a new MCP server with the following configuration:

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

### Option 2: Manual Configuration

Create or edit your MCP configuration file at `~/.config/mcp/mcp.json` (or the appropriate location for your OS):

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

### Option 3: Local Development Setup

For local development or testing:

```json
{
  "servers": {
    "508-accessibility-local": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/your/508-accessibility-mcp-server/lib/src/index.js", "stdio"]
    }
  }
}
```

## Available Tools

Once configured, you'll have access to these tools in VS Code:

1. **check_accessibility**: Analyzes a single webpage for Section 508 compliance
2. **generate_compliance_report**: Generates detailed CSV reports with multi-page crawling support

## Usage Examples

### Single Page Analysis
```
Please check the accessibility compliance of https://example.com
```

### Multi-Page Website Report
```
Generate a compliance report for https://example.com with crawling enabled, depth of 2 pages, and save to accessibility-report.csv
```

### With Authentication
```
Check accessibility for https://example.com/dashboard with basic auth username "user" and password "pass"
```

## Troubleshooting

1. **Command not found**: Ensure the package is installed globally or use the full path to the executable
2. **Permission issues**: On Unix systems, you may need to make the script executable: `chmod +x /path/to/index.js`
3. **Dependencies**: Ensure Node.js version 16+ is installed