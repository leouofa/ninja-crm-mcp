import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  extractTemplateVariables,
  substituteVariables,
  toTemplatePromptSlug,
} from "../src/prompts/index.js";
import { createNinjaCrmMcpServer } from "../src/server.js";

describe("Ninja CRM MCP Prompts", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function setupTestClient() {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const serverInstance = createNinjaCrmMcpServer({ baseUrl: "http://mock-ninja-crm" });
    await serverInstance.server.connect(serverTransport);

    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    await client.connect(clientTransport);

    return {
      client,
      serverInstance,
      cleanup: async () => {
        await client.close();
        await serverInstance.server.close();
      },
    };
  }

  it("extracts unique placeholder variables and substitutes them", () => {
    const template = "Hello {{name}}, welcome to {{company}}! Reach us at {{email}} or {{company}} support.";
    const vars = extractTemplateVariables(template);
    expect(vars).toEqual(["name", "company", "email"]);

    const rendered = substituteVariables(template, {
      name: "Toby",
      company: "Flenderson LLC",
      email: "toby@flenderson.com",
    });
    expect(rendered).toBe("Hello Toby, welcome to Flenderson LLC! Reach us at toby@flenderson.com or Flenderson LLC support.");
  });

  it("generates clean prompt slugs", () => {
    expect(toTemplatePromptSlug(1, "Outbound Enterprise 2026!")).toBe("ninja_crm_outreach_1_outbound_enterprise_2026");
    expect(toTemplatePromptSlug(2, "")).toBe("ninja_crm_outreach_2_template");
  });

  it("lists static prompts", async () => {
    const { client, cleanup } = await setupTestClient();
    const { prompts } = await client.listPrompts();

    const names = prompts.map((p) => p.name);
    expect(names).toContain("ninja_crm_personalize_outreach");
    expect(names).toContain("ninja_crm_pipeline_review");

    await cleanup();
  });

  it("gets and renders ninja_crm_personalize_outreach prompt", async () => {
    // Lead lookup
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/v1/leads/3")) {
        return new Response(
          JSON.stringify({
            id: 3,
            category_id: 5,
            status: "in_progress",
            status_label: "In-Progress",
            notes: "Met at SaaStr, interested in our compliance features.",
            contact: {
              name: "Phyllis Vance",
              company: "Vance Refrigeration",
              role: "Head of Sales",
              email: "phyllis@vancerefrig.com",
            },
            category: { id: 5, name: "Mid-Market Cold" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (url.includes("/api/v1/templates")) {
        return new Response(
          JSON.stringify([
            {
              id: 11,
              category_id: 5,
              body: "Hi {{name}}, are you free for a 15-minute chat about {{company}}?",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
    });

    const { client, cleanup } = await setupTestClient();
    const res = await client.getPrompt({
      name: "ninja_crm_personalize_outreach",
      arguments: {
        lead_id: "3",
        tone: "casual",
        value_prop_focus: "SOC2 automation",
      },
    });

    expect(res.messages).toHaveLength(1);
    const content = res.messages[0].content as { type: "text"; text: string };
    expect(content.text).toContain("Phyllis Vance");
    expect(content.text).toContain("Vance Refrigeration");
    expect(content.text).toContain("Met at SaaStr, interested in our compliance features.");
    expect(content.text).toContain("SOC2 automation");

    await cleanup();
  });

  it("dynamically syncs templates into native MCP prompts", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 1,
            category_id: 10,
            body: "Hi {{first_name}}, noticed your team at {{company}} is expanding.",
            category: { id: 10, name: "Founder Outreach" },
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const { client, serverInstance, cleanup } = await setupTestClient();
    const synced = await serverInstance.syncTemplates();
    expect(synced).toBe(1);

    const { prompts } = await client.listPrompts();
    const dynamicPrompt = prompts.find((p) => p.name === "ninja_crm_outreach_10_founder_outreach");
    expect(dynamicPrompt).toBeDefined();

    // Call dynamic prompt
    const res = await client.getPrompt({
      name: "ninja_crm_outreach_10_founder_outreach",
      arguments: {
        first_name: "Michael",
        company: "Dunder Mifflin Paper Company",
      },
    });

    const msg = res.messages[0].content as { type: "text"; text: string };
    expect(msg.text).toBe("Hi Michael, noticed your team at Dunder Mifflin Paper Company is expanding.");

    await cleanup();
  });
});
