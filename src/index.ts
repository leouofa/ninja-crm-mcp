#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Command } from "commander";
import { createNinjaCrmMcpServer } from "./server.js";

const program = new Command()
  .name("ninja-crm-mcp")
  .description("Official Model Context Protocol (MCP) server for Ninja CRM REST API v1")
  .version("1.0.0")
  .option("-u, --url <url>", "Ninja CRM API base URL (defaults to NINJA_CRM_API_URL or http://localhost:3000)")
  .option("-k, --api-key <key>", "Ninja CRM API key / bearer token (defaults to NINJA_CRM_API_KEY)")
  .option("-t, --timeout <ms>", "Request timeout in milliseconds", (val) => Number.parseInt(val, 10))
  .option("--no-sync", "Disable initial outreach template synchronization on startup");

program.parse(process.argv);
const options = program.opts();

const baseUrl = options.url || process.env.NINJA_CRM_API_URL || "http://localhost:3000";
const apiKey = options.apiKey || process.env.NINJA_CRM_API_KEY;
const timeoutMs = options.timeout ? Number(options.timeout) : undefined;
const shouldSync = options.sync !== false;

async function main() {
  const { server, client, syncTemplates } = createNinjaCrmMcpServer({
    baseUrl,
    apiKey,
    timeoutMs,
  });

  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  const cleanup = async () => {
    process.stderr.write("\nShutting down Ninja CRM MCP server...\n");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  await server.connect(transport);
  process.stderr.write(`Ninja CRM MCP server running on stdio (Ninja CRM URL: ${client.getBaseUrl()})\n`);

  if (shouldSync) {
    const synced = await syncTemplates();
    if (synced > 0) {
      process.stderr.write(`Synced ${synced} outreach template(s) from Ninja CRM into native MCP prompts.\n`);
    }
  }
}

main().catch((error) => {
  process.stderr.write(
    `Fatal error in Ninja CRM MCP server: ${error instanceof Error ? error.stack || error.message : error}\n`
  );
  process.exit(1);
});
