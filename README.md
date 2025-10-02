# 508 Accessibility Compliance MCP Server

A Model Context Protocol (MCP)### 2. `generate_compliance_report`
Generates a detailed CSV report of Section 508 compliance for a webpage or website with optional authentication and multi-page crawling support.

**Parameters:**
- `url` (string): URL of the webpage or website to analyze
- `outputPath` (string, optional): Path where to save the CSV report
- `authentication` (object, optional): Same authentication options as above
- `crawling` (object, optional): Same crawling options as above that analyzes web pages for Section 508 accessibility compliance. This server provides comprehensive accessibility testing based on WCAG 2.0 Level A and AA success criteria as required by Section 508 of the Rehabilitation Act.

## Features

### 🔍 **Section 508 Compliance Checking**
- Analyzes web pages against all 36 WCAG 2.0 Level A and AA requirements
- Uses industry-standard tools (axe-core) for automated accessibility testing
- Provides detailed compliance status for each requirement

### �️ **Multi-Page Website Crawling**
- Crawls entire websites to analyze multiple pages for compliance
- Configurable crawl depth and page limits
- Smart filtering with include/exclude path patterns
- Same-origin restriction options for security
- Discovers pages through link analysis
- Batch processing with progress tracking

### �📊 **CSV Report Generation**
- Generates detailed CSV reports with compliance status
- Includes full page URL and page title for tracking compliance by specific page
- Multi-page reports show compliance across entire websites
- Includes requirement descriptions, WCAG criteria, and Section 508 references
- Lists specific issues found for non-compliant items
- Categorizes compliance as: Comply, Do Not Comply, Partially Comply, Does Not Apply

### 📖 **Accessibility Guidelines Reference**
- Provides complete Section 508 requirement information
- Organized by WCAG 2.0 principles: Perceivable, Operable, Understandable, Robust
- Includes WCAG criteria mapping and Section 508 references

### 🔐 **Authentication Support**
- Supports multiple authentication methods for protected web pages
- **Basic Authentication**: HTTP Basic Auth with username/password
- **Form-based Authentication**: Custom login forms with CSS selectors
- **SSO Integration**: Microsoft, Google, Okta, and custom SSO providers
- **Cookie-based Authentication**: Pre-set authentication cookies
- **Authentication Testing**: Verify credentials before running accessibility analysis

## Available Tools

### 1. `check_website_accessibility`
Analyzes a webpage or website for Section 508 accessibility compliance with optional authentication and multi-page crawling support.

**Parameters:**
- `url` (string): URL of the webpage or website to analyze
- `authentication` (object, optional): Authentication configuration for protected pages
  - `type`: Authentication type - "none", "basic", "sso", "form"
  - `username`: Username for authentication
  - `password`: Password for authentication
  - `ssoProvider`: SSO provider - "microsoft", "google", "okta", "saml", "other"
  - `ssoUrl`: SSO login URL
  - `usernameSelector`: CSS selector for username field
  - `passwordSelector`: CSS selector for password field
  - `submitSelector`: CSS selector for submit button
  - `waitForSelector`: CSS selector to wait for after login
  - `cookies`: Array of cookies to set for authentication
- `crawling` (object, optional): Multi-page crawling configuration
  - `enabled`: Enable multi-page crawling (default: false)
  - `maxPages`: Maximum number of pages to analyze (default: 50)
  - `maxDepth`: Maximum crawl depth (default: 3)
  - `includePaths`: URL paths to include (e.g., ['/products/', '/services/'])
  - `excludePaths`: URL paths to exclude (e.g., ['/admin/', '/api/'])
  - `sameOriginOnly`: Only crawl pages from the same domain (default: true)
  - `followExternalLinks`: Follow links to external domains (default: false)

**Returns:**
- Summary with compliance statistics
- Overview of first 10 detailed results
- Overall compliance rate percentage
- Authentication status

### 2. `generate_compliance_report`
Generates a detailed CSV report of Section 508 compliance with optional authentication support.

**Parameters:**
- `url` (string): URL of the webpage to analyze
- `outputPath` (string, optional): Directory where to save the CSV report
- `authentication` (object, optional): Same authentication options as above

**Returns:**
- Path to generated CSV report
- Compliance summary statistics
- Authentication status

### 3. `test_authentication`
Tests authentication methods for a webpage to verify login credentials work before running accessibility analysis.

**Parameters:**
- `url` (string): URL of the webpage to test authentication on
- `authentication` (object): Authentication configuration to test (same options as above, except type cannot be "none")

**Returns:**
- Authentication success status
- Before and after authentication page information
- Diagnostic information for troubleshooting

### 4. `get_accessibility_guidelines`
Retrieves Section 508 accessibility requirements and guidelines.

**Parameters:**
- `category` (enum, optional): Filter by category - "all", "perceivable", "operable", "understandable", "robust"

**Returns:**
- Filtered list of requirements with descriptions
- WCAG criteria and Section 508 references

## Requirements Tested

This server tests compliance against all WCAG 2.0 Level A and AA success criteria required by Section 508:

### Perceivable (1.1 - 1.4)
- Non-text content alternatives
- Time-based media alternatives
- Adaptable content structure
- Distinguishable content (contrast, audio control, etc.)

### Operable (2.1 - 2.4)
- Keyboard accessibility
- No timing constraints
- Seizure prevention
- Navigable content

### Understandable (3.1 - 3.3)
- Readable content
- Predictable functionality
- Input assistance

### Robust (4.1)
- Compatible with assistive technologies
- Valid markup and proper semantics

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

#### For End Users (VS Code Integration)

Install globally via npm:
```bash
npm install -g 508-accessibility-mcp-server
```

Then configure in VS Code using the AI Toolkit extension or by adding to your MCP configuration:
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

See [MCP_CONFIGURATION.md](./MCP_CONFIGURATION.md) for detailed VS Code setup instructions.

#### For Development

1. Clone the repository:
```bash
git clone <repository-url>
cd 508-accessibility-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

### Running the Server

#### SSE Mode (recommended for development)
```bash
npm run dev:sse
```
The server will start on port 3001 with hot reload.

#### STDIO Mode (for production/integration)
```bash
node lib/src/index.js stdio
```

#### Using with MCP Inspector
```bash
npm run dev:inspector
```
Opens the MCP Inspector for testing tools interactively.

### Testing

The project includes comprehensive tests organized in the `test/` directory:

#### Run All Tests
```bash
npm test
```

#### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only  
npm run test:integration

# Individual MCP server test
npm run test:mcp
```

#### Test Structure
- `test/fixtures/` - Test HTML pages and static test files
- `test/unit/` - Unit tests for individual components
- `test/integration/` - Full MCP server integration tests

See [test/README.md](./test/README.md) for detailed testing information.

## Dependencies

### Core MCP Framework
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `zod`: Input validation

### Accessibility Testing
- `puppeteer`: Headless browser automation for web scraping
- `axe-core`: Industry-standard accessibility testing engine
- `cheerio`: Server-side HTML parsing and analysis
- `color`: Color contrast ratio calculations

### Report Generation
- `csv-writer`: CSV file generation for compliance reports

## Usage Examples

### Basic Accessibility Check
```typescript
const result = await client.callTool({
  name: "check_website_accessibility",
  arguments: { url: "https://example.com" }
});
```

### Accessibility Check with Form Authentication
```typescript
const result = await client.callTool({
  name: "check_website_accessibility",
  arguments: { 
    url: "https://protected-site.com/dashboard",
    authentication: {
      type: "form",
      username: "your-username",
      password: "your-password",
      usernameSelector: "#email",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      waitForSelector: ".dashboard"
    }
  }
});
```

### Accessibility Check with Microsoft SSO
```typescript
const result = await client.callTool({
  name: "check_website_accessibility",
  arguments: { 
    url: "https://portal.office.com",
    authentication: {
      type: "sso",
      ssoProvider: "microsoft",
      username: "user@company.com",
      password: "your-password",
      ssoUrl: "https://login.microsoftonline.com"
    }
  }
});
```

### Test Authentication Before Analysis
```typescript
const authTest = await client.callTool({
  name: "test_authentication",
  arguments: { 
    url: "https://protected-site.com",
    authentication: {
      type: "form",
      username: "test-user",
      password: "test-password",
      usernameSelector: "#username",
      passwordSelector: "#password"
    }
  }
});
```

### Generate Compliance Report with Authentication
```typescript
const report = await client.callTool({
  name: "generate_compliance_report", 
  arguments: { 
    url: "https://internal-app.company.com",
    outputPath: "./reports",
    authentication: {
      type: "basic",
      username: "api-user",
      password: "api-password"
    }
  }
});
```

### Get Guidelines by Category
```typescript
const guidelines = await client.callTool({
  name: "get_accessibility_guidelines",
  arguments: { category: "perceivable" }
});
```

## Authentication Methods

### Basic HTTP Authentication
For sites using HTTP Basic Auth:
```typescript
authentication: {
  type: "basic",
  username: "your-username",
  password: "your-password"
}
```

### Form-based Authentication
For custom login forms:
```typescript
authentication: {
  type: "form",
  username: "your-username",
  password: "your-password",
  usernameSelector: "#email",           // CSS selector for username field
  passwordSelector: "#password",        // CSS selector for password field
  submitSelector: "button[type='submit']", // CSS selector for submit button
  waitForSelector: ".user-menu"         // Element to wait for after successful login
}
```

### SSO Authentication
For Single Sign-On providers:

#### Microsoft/Azure AD
```typescript
authentication: {
  type: "sso",
  ssoProvider: "microsoft",
  username: "user@company.com",
  password: "your-password",
  ssoUrl: "https://login.microsoftonline.com"
}
```

#### Google SSO
```typescript
authentication: {
  type: "sso",
  ssoProvider: "google",
  username: "user@gmail.com",
  password: "your-password",
  ssoUrl: "https://accounts.google.com"
}
```

#### Okta SSO
```typescript
authentication: {
  type: "sso",
  ssoProvider: "okta",
  username: "your-username",
  password: "your-password",
  ssoUrl: "https://company.okta.com"
}
```

#### Custom SSO
```typescript
authentication: {
  type: "sso",
  ssoProvider: "other",
  username: "your-username",
  password: "your-password",
  ssoUrl: "https://sso.company.com",
  usernameSelector: "#username",
  passwordSelector: "#password",
  submitSelector: "#login-button"
}
```

### Cookie-based Authentication
For pre-authenticated sessions:
```typescript
authentication: {
  type: "form",
  cookies: [
    { name: "session_token", value: "abc123", domain: ".company.com" },
    { name: "auth_user", value: "user123" }
  ]
}
```

## Multi-Page Website Crawling

### Basic Website Crawling
Analyze an entire website with default settings:
```typescript
const result = await client.callTool({
  name: "check_website_accessibility",
  arguments: { 
    url: "https://example.com",
    crawling: {
      enabled: true,
      maxPages: 25,
      maxDepth: 2
    }
  }
});
```

### Targeted Crawling with Path Filtering
Focus on specific sections of a website:
```typescript
const result = await client.callTool({
  name: "check_website_accessibility",
  arguments: { 
    url: "https://company.com",
    crawling: {
      enabled: true,
      maxPages: 50,
      maxDepth: 3,
      includePaths: ["/products/", "/services/", "/support/"],
      excludePaths: ["/admin/", "/api/", "/internal/"]
    }
  }
});
```

### Crawling with Authentication
Analyze protected pages across a website:
```typescript
const result = await client.callTool({
  name: "check_website_accessibility",
  arguments: { 
    url: "https://portal.company.com",
    authentication: {
      type: "form",
      username: "your-username",
      password: "your-password",
      usernameSelector: "#email",
      passwordSelector: "#password",
      submitSelector: ".login-button"
    },
    crawling: {
      enabled: true,
      maxPages: 30,
      maxDepth: 2,
      sameOriginOnly: true
    }
  }
});
```

### Generate Multi-Page Compliance Report
Create a comprehensive CSV report for an entire website:
```typescript
const report = await client.callTool({
  name: "generate_compliance_report",
  arguments: { 
    url: "https://public-website.org",
    outputPath: "./compliance-reports",
    crawling: {
      enabled: true,
      maxPages: 100,
      maxDepth: 4,
      excludePaths: ["/downloads/", "/media/"]
    }
  }
});
```

### External Link Analysis
Analyze external links as well (use with caution):
```typescript
const result = await client.callTool({
  name: "check_website_accessibility",
  arguments: { 
    url: "https://hub-site.com",
    crawling: {
      enabled: true,
      maxPages: 20,
      maxDepth: 1,
      sameOriginOnly: false,
      followExternalLinks: true
    }
  }
});
```

## Authentication Methods

### Basic HTTP Authentication
For sites using HTTP Basic Auth:
```typescript
authentication: {
  type: "basic",
  username: "your-username",
  password: "your-password"
}
```

### Form-based Authentication
For custom login forms:
```typescript
authentication: {
  type: "form",
  username: "your-username",
  password: "your-password",
  usernameSelector: "#email",           // CSS selector for username field
  passwordSelector: "#password",        // CSS selector for password field
  submitSelector: "button[type='submit']", // CSS selector for submit button
  waitForSelector: ".user-menu"         // Element to wait for after successful login
}
```

### SSO Authentication
For Single Sign-On providers:

#### Microsoft/Azure AD
```typescript
authentication: {
  type: "sso",
  ssoProvider: "microsoft",
  username: "user@company.com",
  password: "your-password",
  ssoUrl: "https://login.microsoftonline.com"
}
```

#### Google SSO
```typescript
authentication: {
  type: "sso",
  ssoProvider: "google",
  username: "user@gmail.com",
  password: "your-password",
  ssoUrl: "https://accounts.google.com"
}
```

#### Okta SSO
```typescript
authentication: {
  type: "sso",
  ssoProvider: "okta",
  username: "your-username",
  password: "your-password",
  ssoUrl: "https://company.okta.com"
}
```

#### Custom SSO
```typescript
authentication: {
  type: "sso",
  ssoProvider: "other",
  username: "your-username",
  password: "your-password",
  passwordSelector: "#password",
  submitSelector: "#login-button"
}
```

### Cookie-based Authentication
For pre-authenticated sessions:
```typescript
authentication: {
  type: "form",  // or "none" if just setting cookies
  cookies: [
    {
      name: "session_token",
      value: "abc123...",
      domain: ".company.com"
    },
    {
      name: "auth_token",
      value: "xyz789..."
    }
  ]
}
```

## CSV Report Format

Generated CSV reports include the following columns:
- **Page URL**: Full URL of the webpage that was analyzed
- **Requirement**: Name of the accessibility requirement
- **Description**: Detailed description of what the requirement covers
- **WCAG Criteria**: Corresponding WCAG 2.0 success criteria
- **Section 508 Reference**: Reference to Section 508 regulation
- **Compliance Status**: Comply | Do Not Comply | Partially Comply | Does Not Apply
- **Issues Found**: Specific accessibility issues detected

## How to Debug the 508 Accessibility Compliance MCP Server

> Notes:
> - [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is a visual developer tool for testing and debugging MCP servers.
> - All debugging modes support breakpoints, so you can add breakpoints to the tool implementation code.

| Debug Mode | Description | Steps to debug |
| ---------- | ----------- | --------------- |
| Agent Builder | Debug the MCP server in the Agent Builder via AI Toolkit. | 1. Open VS Code Debug panel. Select `Debug in Agent Builder` and press `F5` to start debugging the MCP server.<br>2. Use AI Toolkit Agent Builder to test the server with accessibility checking prompts.<br>3. Click `Run` to test the server with accessibility analysis. |
| MCP Inspector for SSE | Debug the MCP server using the MCP Inspector. | 1. Open VS Code Debug panel. Select `Debug SSE in Inspector (Edge)` or `Debug SSE in Inspector (Chrome)`. Press F5 to start debugging.<br>2. When MCP Inspector launches in the browser, click the `Connect` button to connect this MCP server.<br>3. Then you can `List Tools`, select a tool (check_website_accessibility, generate_compliance_report, get_accessibility_guidelines), input parameters, and `Run Tool` to debug your server code.<br> |
| MCP Inspector for STDIO | Debug the MCP server using the MCP Inspector. | 1. Open VS Code Debug panel. Select `Debug STDIO in Inspector`. Press F5 to start debugging.<br>2. When MCP Inspector launches in your default browser, click the `Connect` button to connect this MCP server.<br>3. Then you can `List Tools`, select a tool, input parameters, and `Run Tool` to debug your server code.<br>4. Of course, you can add breakpoint to the tool implementation code. |

## Legal Compliance

This server is designed to help organizations comply with:
- **Section 508** of the Rehabilitation Act (29 U.S.C. §794d)
- **WCAG 2.0 Level A and AA** success criteria
- **Federal accessibility requirements** for ICT (Information and Communication Technology)

## Status

✅ **Server Implementation Complete**
- All four tools implemented (check_website_accessibility, generate_compliance_report, test_authentication, get_accessibility_guidelines)
- 36 WCAG 2.0 Level A and AA requirements tested
- Authentication support for protected pages (Basic, Form, SSO, Cookies)
- SSO integration for Microsoft, Google, Okta, and custom providers
- Dependencies installed and configured
- TypeScript compilation successful
- Server running on SSE mode (port 3001)

🔧 **Enhanced Features Added**
- Multi-factor authentication support
- Authentication testing tool
- Form-based login with custom CSS selectors
- Cookie-based authentication
- SSO provider integration

🔧 **Next Steps**
- Test tools with authenticated websites
- Validate authentication methods with real SSO providers
- Test CSV report generation with protected pages
- Add more sophisticated accessibility checks
- Optimize performance for large websites

## License

This project is open source and available under the MIT License.

## Support

For questions about Section 508 compliance requirements, refer to:
- [Section 508 ICT Standards](https://www.access-board.gov/ict/)
- [WCAG 2.0 Guidelines](https://www.w3.org/WAI/WCAG20/quickref/)
- [Federal accessibility requirements](https://www.section508.gov/)

If you have any feedback or suggestions for this template, please open an issue on the [AI Toolkit GitHub repository](https://github.com/microsoft/vscode-ai-toolkit/issues)