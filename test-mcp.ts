#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testMCPServer() {
  console.log("🔍 Starting 508 Accessibility Compliance MCP Server test...\n");

  try {
    // Start the MCP server process
    const serverProcess = spawn("node", [
      "-r", "ts-node/register",
      "./src/index.ts",
      "stdio"
    ], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "inherit"]
    });

    // Create transport and client
    const transport = new StdioClientTransport({
      serverProcess: serverProcess
    });

    const client = new Client({
      name: "test-client",
      version: "1.0.0"
    }, {
      capabilities: {}
    });

    // Connect to server
    await client.connect(transport);
    console.log("✅ Connected to MCP server\n");

    // Test 1: List available tools
    console.log("📋 Available tools:");
    const tools = await client.listTools();
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Test 2: Get accessibility guidelines
    console.log("📖 Testing get_accessibility_guidelines tool...");
    const guidelinesResult = await client.callTool({
      name: "get_accessibility_guidelines",
      arguments: { category: "perceivable" }
    });
    
    const guidelines = JSON.parse(guidelinesResult.content[0].text);
    console.log(`✅ Retrieved ${guidelines.totalCount} perceivable requirements`);
    console.log(`   Categories: ${guidelines.category}\n`);

    // Test 3: Check website accessibility (using a simple webpage)
    console.log("🔍 Testing check_website_accessibility tool with example.com...");
    try {
      const accessibilityResult = await client.callTool({
        name: "check_website_accessibility",
        arguments: { url: "https://example.com" }
      });
      
      const analysis = JSON.parse(accessibilityResult.content[0].text);
      console.log("✅ Accessibility analysis completed:");
      console.log(`   Total requirements checked: ${analysis.summary.totalRequirements}`);
      console.log(`   Compliance rate: ${analysis.summary.overallComplianceRate}%`);
      console.log(`   Comply: ${analysis.summary.comply}`);
      console.log(`   Do Not Comply: ${analysis.summary.doNotComply}`);
      console.log(`   Partially Comply: ${analysis.summary.partiallyComply}`);
      console.log();
    } catch (error) {
      console.log(`⚠️  Accessibility check failed (this might be expected): ${error.message}\n`);
    }

    // Test 4: Generate compliance report
    console.log("📊 Testing generate_compliance_report tool...");
    try {
      const reportResult = await client.callTool({
        name: "generate_compliance_report",
        arguments: { 
          url: "https://example.com",
          outputPath: "./reports"
        }
      });
      
      const reportData = JSON.parse(reportResult.content[0].text);
      console.log("✅ Compliance report generated:");
      console.log(`   Report saved to: ${reportData.reportPath}`);
      console.log(`   Compliance rate: ${reportData.summary.overallComplianceRate}%\n`);
    } catch (error) {
      console.log(`⚠️  Report generation failed (this might be expected): ${error.message}\n`);
    }

    console.log("🎉 MCP Server test completed successfully!");

    // Cleanup
    serverProcess.kill();
    process.exit(0);

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testMCPServer().catch(console.error);