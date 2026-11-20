import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NinjaCrmClient, type NinjaCrmClientOptions } from "./client/ninja-crm-client.js";
import { registerPrompts, syncTemplatesFromNinjaCrm } from "./prompts/index.js";
import { registerResources } from "./resources/index.js";
import { registerTools } from "./tools/index.js";

export interface NinjaCrmServerInstance {
  server: McpServer;
  client: NinjaCrmClient;
  syncTemplates: () => Promise<number>;
}

export function createNinjaCrmMcpServer(options: NinjaCrmClientOptions = {}): NinjaCrmServerInstance {
  const client = new NinjaCrmClient(options);

  const server = new McpServer(
    {
      name: "ninja-crm-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: { listChanged: true },
        resources: { listChanged: true },
        prompts: { listChanged: true },
      },
    }
  );

  registerTools(server, client);
  registerResources(server, client);
  registerPrompts(server, client);

  const syncTemplates = () => syncTemplatesFromNinjaCrm(server, client);

  return { server, client, syncTemplates };
}
