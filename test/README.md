# Test Directory Structure

This directory contains all test files for the 508 Accessibility MCP Server.

## Structure

```
test/
├── fixtures/           # Test HTML pages and other static test files
│   └── test-page.html  # Sample HTML page with accessibility issues for testing
├── integration/        # Integration tests that test the full MCP server
│   └── test-mcp.ts     # Full MCP server integration test
└── unit/              # Unit tests for individual components
    ├── test-auth-features.js    # Authentication features test
    ├── test-csv-format.js       # CSV report format test
    └── test-multipage.js        # Multi-page crawling test
```

## Running Tests

### Integration Tests
```bash
# Run the full MCP server test
node -r ts-node/register test/integration/test-mcp.ts
```

### Unit Tests
```bash
# Run authentication features test
node test/unit/test-auth-features.js

# Run CSV format test
node test/unit/test-csv-format.js

# Run multi-page crawling test
node test/unit/test-multipage.js
```

### Test HTML Page
The `test/fixtures/test-page.html` file contains a sample HTML page with various accessibility issues for testing the compliance checker.

## Test Files Description

- **test-mcp.ts**: Integration test that starts the MCP server and tests the full workflow
- **test-auth-features.js**: Tests authentication configurations and scenarios
- **test-csv-format.js**: Tests CSV report generation and formatting
- **test-multipage.js**: Tests multi-page website crawling functionality
- **test-page.html**: Sample HTML page with accessibility issues for testing

## Adding New Tests

1. **Unit tests**: Add to `test/unit/` directory
2. **Integration tests**: Add to `test/integration/` directory  
3. **Test fixtures**: Add to `test/fixtures/` directory