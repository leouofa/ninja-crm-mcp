import { type McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NinjaCrmClient } from "../client/ninja-crm-client.js";

export function registerResources(server: McpServer, client: NinjaCrmClient): void {
  // 1. Pipeline Stats Resource
  server.resource(
    "ninja_crm_stats",
    "ninja-crm://stats",
    {
      mimeType: "application/json",
      description: "Aggregated Ninja CRM pipeline statistics: contacts, leads by status, categories, and templates",
    },
    async (uri) => {
      const stats = await client.getStats();
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(stats, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // 2. Active Leads Feed Resource
  server.resource(
    "ninja_crm_active_leads",
    "ninja-crm://leads/active",
    {
      mimeType: "application/json",
      description: "Feed of active Ninja CRM leads (backlog, in_progress, done)",
    },
    async (uri) => {
      const [backlog, inProgress, done] = await Promise.all([
        client.listLeads({ status: "backlog", limit: 100 }),
        client.listLeads({ status: "in_progress", limit: 100 }),
        client.listLeads({ status: "done", limit: 100 }),
      ]);

      const activeLeads = {
        total_active: backlog.items.length + inProgress.items.length + done.items.length,
        backlog: backlog.items,
        in_progress: inProgress.items,
        done: done.items,
      };

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(activeLeads, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // 3. Leads by Status Resource Template
  server.resource(
    "ninja_crm_leads_by_status",
    new ResourceTemplate("ninja-crm://leads/{status}", {
      list: async () => {
        const statuses = ["backlog", "in_progress", "done", "archived"];
        return {
          resources: statuses.map((status) => ({
            uri: `ninja-crm://leads/${status}`,
            name: `Leads: ${status}`,
            description: `Ninja CRM leads in '${status}' status`,
            mimeType: "application/json",
          })),
        };
      },
    }),
    {
      mimeType: "application/json",
      description: "Leads grouped by pipeline status ('backlog', 'in_progress', 'done', 'archived')",
    },
    async (uri, params) => {
      const status = String(params.status);
      const result = await client.listLeads({ status, limit: 100 });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(
              {
                status,
                count: result.meta.total_count,
                leads: result.items,
              },
              null,
              2
            ),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // 4. Categories Index Resource
  server.resource(
    "ninja_crm_categories",
    "ninja-crm://categories",
    {
      mimeType: "application/json",
      description: "Index of all outreach categories in Ninja CRM",
    },
    async (uri) => {
      const categories = await client.listCategories({ limit: 100 });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(categories, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // 5. Outreach Templates Resource
  server.resource(
    "ninja_crm_templates",
    "ninja-crm://templates",
    {
      mimeType: "application/json",
      description: "Index of all outreach email templates with associated categories",
    },
    async (uri) => {
      const templates = await client.listTemplates({ limit: 100 });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(templates, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );
}
