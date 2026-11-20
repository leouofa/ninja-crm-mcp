import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NinjaCrmClient } from "../client/ninja-crm-client.js";
/**
 * Extracts all unique placeholder variable names from a template string.
 * Example: "Hi {{name}} from {{company}}" -> ["name", "company"]
 */
export declare function extractTemplateVariables(body: string): string[];
/**
 * Substitutes {{variable}} placeholders in a template string.
 */
export declare function substituteVariables(template: string, variables: Record<string, string>): string;
/**
 * Normalizes a category name to an MCP-compliant prompt identifier.
 */
export declare function toTemplatePromptSlug(categoryId: number, categoryName: string): string;
export declare function registerPrompts(server: McpServer, client: NinjaCrmClient): void;
/**
 * Dynamically synchronizes saved category outreach templates into native MCP prompts.
 */
export declare function syncTemplatesFromNinjaCrm(server: McpServer, client: NinjaCrmClient): Promise<number>;
//# sourceMappingURL=index.d.ts.map