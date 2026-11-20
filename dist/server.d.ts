import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NinjaCrmClient, type NinjaCrmClientOptions } from "./client/ninja-crm-client.js";
export interface NinjaCrmServerInstance {
    server: McpServer;
    client: NinjaCrmClient;
    syncTemplates: () => Promise<number>;
}
export declare function createNinjaCrmMcpServer(options?: NinjaCrmClientOptions): NinjaCrmServerInstance;
//# sourceMappingURL=server.d.ts.map