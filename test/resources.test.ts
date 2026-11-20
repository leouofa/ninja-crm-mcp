import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNinjaCrmMcpServer } from "../src/server.js";

describe("Ninja CRM MCP Resources", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function setupTestClient() {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const { server } = createNinjaCrmMcpServer({ baseUrl: "http://mock-ninja-crm" });
    await server.connect(serverTransport);

    const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
    await client.connect(clientTransport);

    return {
      client,
      cleanup: async () => {
        await client.close();
        await server.close();
      },
    };
  }

  it("lists static resources and resource templates", async () => {
    const { client, cleanup } = await setupTestClient();
    const { resources } = await client.listResources();
    const { resourceTemplates } = await client.listResourceTemplates();

    const uris = resources.map((r) => r.uri);
    expect(uris).toContain("ninja-crm://stats");
    expect(uris).toContain("ninja-crm://leads/active");
    expect(uris).toContain("ninja-crm://categories");
    expect(uris).toContain("ninja-crm://templates");

    const templateUris = resourceTemplates.map((rt) => rt.uriTemplate);
    expect(templateUris).toContain("ninja-crm://leads/{status}");

    await cleanup();
  });

  it("reads ninja-crm://stats resource", async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      let count = 0;
      if (url.includes("/contacts")) count = 50;
      else if (url.includes("/leads?status=backlog")) count = 20;
      else if (url.includes("/leads?status=in_progress")) count = 10;
      else if (url.includes("/leads?status=done")) count = 5;
      else if (url.includes("/leads?status=archived")) count = 2;
      else if (url.includes("/leads")) count = 37;
      else if (url.includes("/categories")) count = 4;
      else if (url.includes("/templates")) count = 3;

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Total-Count": String(count),
        },
      });
    });

    const { client, cleanup } = await setupTestClient();
    const res = await client.readResource({ uri: "ninja-crm://stats" });

    expect(res.contents).toHaveLength(1);
    const content = res.contents[0] as { uri: string; mimeType: string; text: string };
    expect(content.uri).toBe("ninja-crm://stats");
    const parsed = JSON.parse(content.text);
    expect(parsed.total_contacts).toBe(50);
    expect(parsed.total_leads).toBe(37);
    expect(parsed.leads_by_status.backlog).toBe(20);

    await cleanup();
  });

  it("reads ninja-crm://leads/{status} parameterized resource", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 1,
            contact_id: 10,
            category_id: 2,
            status: "in_progress",
            contact: { name: "Stanley Hudson" },
          },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Total-Count": "1",
          },
        }
      )
    );

    const { client, cleanup } = await setupTestClient();
    const res = await client.readResource({ uri: "ninja-crm://leads/in_progress" });

    expect(res.contents).toHaveLength(1);
    const content = res.contents[0] as { uri: string; mimeType: string; text: string };
    const parsed = JSON.parse(content.text);
    expect(parsed.status).toBe("in_progress");
    expect(parsed.count).toBe(1);
    expect(parsed.leads[0].contact.name).toBe("Stanley Hudson");

    await cleanup();
  });
});
