import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { NinjaCrmClient } from "../client/ninja-crm-client.js";

/**
 * Extracts all unique placeholder variable names from a template string.
 * Example: "Hi {{name}} from {{company}}" -> ["name", "company"]
 */
export function extractTemplateVariables(body: string): string[] {
  const matches = Array.from(body.matchAll(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g), (m) => m[1]);
  return Array.from(new Set(matches));
}

/**
 * Substitutes {{variable}} placeholders in a template string.
 */
export function substituteVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    result = result.replace(pattern, value);
  }
  return result;
}

/**
 * Normalizes a category name to an MCP-compliant prompt identifier.
 */
export function toTemplatePromptSlug(categoryId: number, categoryName: string): string {
  const slug = categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  return `ninja_crm_outreach_${categoryId}_${slug || "template"}`;
}

export function registerPrompts(server: McpServer, client: NinjaCrmClient): void {
  // 1. LLM-Driven Dynamic Personalization Prompt
  server.prompt(
    "ninja_crm_personalize_outreach",
    "Prepare a tailored, high-converting outreach email by synthesizing the category template with contact info, role, company, and past lead notes",
    {
      lead_id: z.string().describe("ID of the lead to personalize outreach for"),
      tone: z
        .enum(["consultative", "direct", "casual", "urgent"])
        .optional()
        .describe("Tone of voice for the outreach email (default 'consultative')"),
      value_prop_focus: z
        .string()
        .optional()
        .describe("Specific feature, pain point, or mutual connection to emphasize in the email"),
    },
    async ({ lead_id, tone, value_prop_focus }) => {
      const id = Number(lead_id);
      const lead = await client.getLead(id);

      if (!lead.contact) {
        throw new Error(`Lead #${id} does not have an associated contact record.`);
      }

      // Fetch template for this lead's category
      const templates = await client.listTemplates({ category_id: lead.category_id, limit: 1 });
      const rawTemplate = templates.items[0]?.body || "No standard template found for this category.";
      const categoryName = lead.category?.name || "Uncategorized";

      const promptText = [
        `You are drafting a personalized outreach email for a CRM prospect.`,
        ``,
        `### Prospect Details`,
        `- **Name**: ${lead.contact.name}`,
        `- **Role**: ${lead.contact.role || "Unknown"}`,
        `- **Company**: ${lead.contact.company || "Unknown"}`,
        `- **Email**: ${lead.contact.email || "Unknown"}`,
        `- **LinkedIn**: ${lead.contact.linkedin_url || "None"}`,
        `- **Category**: ${categoryName}`,
        `- **Current Lead Status**: ${lead.status_label || lead.status}`,
        ``,
        `### Lead & Contact History / Notes`,
        lead.notes ? lead.notes : "No past notes recorded.",
        lead.contact.notes ? `Contact Notes: ${lead.contact.notes}` : "",
        ``,
        `### Base Outreach Template`,
        `\`\`\``,
        rawTemplate,
        `\`\`\``,
        ``,
        `### Personalization Requirements`,
        `- **Tone**: ${tone || "consultative"}`,
        value_prop_focus ? `- **Emphasis**: ${value_prop_focus}` : "",
        `- Maintain the core value proposition of the category template while making the message feel bespoke, natural, and directly relevant to the prospect's company and role.`,
        `- Resolve any {{variable}} placeholders with verified information.`,
        `- Provide: (1) Subject line options, (2) Final email body, (3) Recommended next pipeline transition action.`,
      ]
        .filter(Boolean)
        .join("\n");

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: promptText,
            },
          },
        ],
      };
    }
  );

  // 2. CRM Pipeline Review & Opportunity Synthesis Prompt
  server.prompt(
    "ninja_crm_pipeline_review",
    "Conduct an executive review of active CRM leads and pipeline bottlenecks, recommending specific next actions",
    {},
    async () => {
      const [stats, backlogLeads, inProgressLeads] = await Promise.all([
        client.getStats(),
        client.listLeads({ status: "backlog", limit: 25 }),
        client.listLeads({ status: "in_progress", limit: 25 }),
      ]);

      const formatLeadList = (leads: typeof backlogLeads.items) => {
        if (leads.length === 0) return "_No leads in this stage._";
        return leads
          .map(
            (l) =>
              `- **Lead #${l.id}**: ${l.contact?.name || "Unknown"} (${l.contact?.company || "No Company"}) | Category: ${l.category?.name || "N/A"}\n  Notes: ${l.notes || "None"}`
          )
          .join("\n");
      };

      const promptText = [
        `# Ninja CRM Pipeline Health & Opportunity Review`,
        ``,
        `## Pipeline Metrics`,
        `- Total Contacts: ${stats.total_contacts}`,
        `- Total Leads: ${stats.total_leads}`,
        `- Backlog: ${stats.leads_by_status.backlog}`,
        `- In-Progress: ${stats.leads_by_status.in_progress}`,
        `- Done: ${stats.leads_by_status.done}`,
        `- Archived: ${stats.leads_by_status.archived}`,
        ``,
        `## Backlog Leads (${backlogLeads.items.length} listed)`,
        formatLeadList(backlogLeads.items),
        ``,
        `## In-Progress Leads (${inProgressLeads.items.length} listed)`,
        formatLeadList(inProgressLeads.items),
        ``,
        `## Review Tasks`,
        `1. Identify leads that need urgent follow-up or have been in progress without notes.`,
        `2. Recommend which backlog leads should be prioritized for immediate outreach.`,
        `3. Provide concrete action items with specific tool invocations (e.g. \`ninja_crm_update_lead_status\`, \`ninja_crm_draft_outreach\`).`,
      ].join("\n");

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: promptText,
            },
          },
        ],
      };
    }
  );
}

/**
 * Dynamically synchronizes saved category outreach templates into native MCP prompts.
 */
export async function syncTemplatesFromNinjaCrm(server: McpServer, client: NinjaCrmClient): Promise<number> {
  try {
    const templates = await client.listTemplates({ limit: 50 });
    let registeredCount = 0;

    for (const t of templates.items) {
      const categoryName = t.category?.name || `Category ${t.category_id}`;
      const promptSlug = toTemplatePromptSlug(t.category_id, categoryName);
      const variables = extractTemplateVariables(t.body);

      const shape: Record<string, z.ZodString> = {};
      for (const v of variables) {
        shape[v] = z.string().describe(`Template value for {{${v}}}`);
      }

      try {
        server.prompt(
          promptSlug,
          `[Ninja CRM] Outreach Template: ${categoryName}`,
          shape,
          async (args) => {
            const substituted = substituteVariables(t.body, args as Record<string, string>);
            return {
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: substituted,
                  },
                },
              ],
            };
          }
        );
        registeredCount++;
      } catch {
        // Skip duplicate registration or collision
      }
    }

    return registeredCount;
  } catch {
    // If Ninja CRM is temporarily offline during boot, static prompts remain available
    return 0;
  }
}
