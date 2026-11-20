import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNinjaCrmMcpServer } from "../src/server.js";

describe("Ninja CRM MCP Tools", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function setupTestClient() {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const { server, client: apiClient } = createNinjaCrmMcpServer({ baseUrl: "http://mock-ninja-crm" });
    await server.connect(serverTransport);

    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    await client.connect(clientTransport);

    return {
      client,
      apiClient,
      cleanup: async () => {
        await client.close();
        await server.close();
      },
    };
  }

  it("lists all 23 available tools", async () => {
    const { client, cleanup } = await setupTestClient();
    const { tools } = await client.listTools();

    expect(tools.length).toBe(23);
    const names = tools.map((t) => t.name);

    // Contacts
    expect(names).toContain("ninja_crm_list_contacts");
    expect(names).toContain("ninja_crm_get_contact");
    expect(names).toContain("ninja_crm_create_contact");
    expect(names).toContain("ninja_crm_update_contact");
    expect(names).toContain("ninja_crm_delete_contact");

    // Leads
    expect(names).toContain("ninja_crm_list_leads");
    expect(names).toContain("ninja_crm_get_lead");
    expect(names).toContain("ninja_crm_create_lead");
    expect(names).toContain("ninja_crm_update_lead");
    expect(names).toContain("ninja_crm_delete_lead");

    // Categories
    expect(names).toContain("ninja_crm_list_categories");
    expect(names).toContain("ninja_crm_get_category");
    expect(names).toContain("ninja_crm_create_category");
    expect(names).toContain("ninja_crm_update_category");
    expect(names).toContain("ninja_crm_delete_category");

    // Templates
    expect(names).toContain("ninja_crm_list_templates");
    expect(names).toContain("ninja_crm_get_template");
    expect(names).toContain("ninja_crm_create_template");
    expect(names).toContain("ninja_crm_update_template");
    expect(names).toContain("ninja_crm_delete_template");

    // Workflows
    expect(names).toContain("ninja_crm_update_lead_status");
    expect(names).toContain("ninja_crm_draft_outreach");
    expect(names).toContain("ninja_crm_get_stats");

    await cleanup();
  });

  it("executes ninja_crm_create_contact", async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (_url, init) => {
      const body = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          id: 101,
          name: body.name,
          email: body.email,
          company: body.company,
          has_lead: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    });

    const { client, cleanup } = await setupTestClient();
    const res = await client.callTool({
      name: "ninja_crm_create_contact",
      arguments: {
        name: "Pam Beesly",
        email: "pam@dundermifflin.com",
        company: "Dunder Mifflin",
      },
    });

    expect(res.content).toHaveLength(1);
    const content = res.content[0] as { type: "text"; text: string };
    expect(content.text).toContain('"name": "Pam Beesly"');
    expect(content.text).toContain('"company": "Dunder Mifflin"');

    await cleanup();
  });

  it("executes ninja_crm_update_lead_status workflow tool", async () => {
    globalThis.fetch = vi
      .fn()
      // Lead lookup
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 50,
            status: "backlog",
            notes: "Initial phone screen passed",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      // Lead update
      .mockImplementationOnce(async (_url, init) => {
        const body = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            id: 50,
            status: body.status,
            notes: body.notes,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      });

    const { client, cleanup } = await setupTestClient();
    const res = await client.callTool({
      name: "ninja_crm_update_lead_status",
      arguments: {
        id: 50,
        status: "in_progress",
        note: "Scheduled product demo for Tuesday",
      },
    });

    const content = res.content[0] as { type: "text"; text: string };
    expect(content.text).toContain("Lead #50 transitioned to status 'in_progress'");
    expect(content.text).toContain("Scheduled product demo for Tuesday");

    await cleanup();
  });

  it("executes ninja_crm_draft_outreach workflow tool", async () => {
    globalThis.fetch = vi
      .fn()
      // 1. Get lead
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 12,
            category_id: 3,
            contact: {
              id: 44,
              name: "Jim Halpert",
              company: "Athlead",
              role: "VP of Marketing",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      // 2. Get category
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 3, name: "Partnership" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
      // 3. List templates
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 9,
              category_id: 3,
              body: "Hey {{name}}, loving what {{company}} is building. Let's chat!",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    const { client, cleanup } = await setupTestClient();
    const res = await client.callTool({
      name: "ninja_crm_draft_outreach",
      arguments: { lead_id: 12 },
    });

    const content = res.content[0] as { type: "text"; text: string };
    expect(content.text).toContain("Hey Jim Halpert, loving what Athlead is building. Let's chat!");

    await cleanup();
  });

  it("formats API errors cleanly with isError=true", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Record not found",
          errors: ["Contact #999 does not exist"],
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    );

    const { client, cleanup } = await setupTestClient();
    const res = await client.callTool({
      name: "ninja_crm_get_contact",
      arguments: { id: 999 },
    });

    expect(res.isError).toBe(true);
    const content = res.content[0] as { type: "text"; text: string };
    expect(content.text).toContain("Ninja CRM API Error [404]: Record not found");
    expect(content.text).toContain("• Contact #999 does not exist");

    await cleanup();
  });
});
