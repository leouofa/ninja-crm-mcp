import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NinjaCrmApiError, NinjaCrmClient } from "../src/client/ninja-crm-client.js";

describe("NinjaCrmClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("normalizes base URL and trims trailing slashes or /api/v1 suffixes", () => {
    const client1 = new NinjaCrmClient({ baseUrl: "http://127.0.0.1:3000///" });
    expect(client1.getBaseUrl()).toBe("http://127.0.0.1:3000");

    const client2 = new NinjaCrmClient({ baseUrl: "http://localhost:3000/api/v1/" });
    expect(client2.getBaseUrl()).toBe("http://localhost:3000");
  });

  it("attaches Authorization header when apiKey is provided", async () => {
    let capturedHeaders: Headers | undefined;
    globalThis.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = new NinjaCrmClient({ baseUrl: "http://localhost:3000", apiKey: "secret-token" });
    await client.listContacts();

    expect(capturedHeaders?.get("Authorization")).toBe("Bearer secret-token");
  });

  it("handles request timeouts gracefully", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    });

    const client = new NinjaCrmClient({ timeoutMs: 100 });
    await expect(client.getContact(1)).rejects.toThrow("timed out after 100ms");
  });

  it("parses validation errors from Rails API (422)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Validation failed",
          errors: ["Name can't be blank", "Email is invalid"],
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      )
    );

    const client = new NinjaCrmClient();
    try {
      await client.createContact({ name: "" });
      expect.fail("Should have thrown error");
    } catch (err: any) {
      expect(err).toBeInstanceOf(NinjaCrmApiError);
      expect(err.status).toBe(422);
      expect(err.message).toBe("Validation failed");
      expect(err.details).toEqual(["Name can't be blank", "Email is invalid"]);
    }
  });

  it("extracts pagination headers from list responses", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: 1, name: "Alice", created_at: "", updated_at: "", has_lead: false },
        ]),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Total-Count": "42",
            "X-Limit": "10",
            "X-Offset": "20",
          },
        }
      )
    );

    const client = new NinjaCrmClient();
    const result = await client.listContacts({ limit: 10, offset: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.meta.total_count).toBe(42);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.offset).toBe(20);
  });

  // Contacts CRUD
  it("performs full CRUD on contacts", async () => {
    const client = new NinjaCrmClient();

    // Create
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 10, name: "Bob Vance", company: "Vance Refrigeration" }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );
    const created = await client.createContact({ name: "Bob Vance", company: "Vance Refrigeration" });
    expect(created.id).toBe(10);

    // Get
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 10, name: "Bob Vance", company: "Vance Refrigeration" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const fetched = await client.getContact(10);
    expect(fetched.name).toBe("Bob Vance");

    // Update
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 10, name: "Bob Vance", role: "President" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const updated = await client.updateContact(10, { role: "President" });
    expect(updated.role).toBe("President");

    // Delete
    globalThis.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    const deleted = await client.deleteContact(10);
    expect(deleted.success).toBe(true);
  });

  // Leads CRUD
  it("performs full CRUD on leads", async () => {
    const client = new NinjaCrmClient();

    // Create
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 5, contact_id: 10, category_id: 2, status: "backlog" }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );
    const created = await client.createLead({ contact_id: 10, category_id: 2, status: "backlog" });
    expect(created.id).toBe(5);

    // Get
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 5,
          contact_id: 10,
          category_id: 2,
          status: "backlog",
          contact: { id: 10, name: "Bob" },
          category: { id: 2, name: "Enterprise" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const fetched = await client.getLead(5);
    expect(fetched.contact?.name).toBe("Bob");

    // Update
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 5, status: "in_progress", notes: "Called today" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const updated = await client.updateLead(5, { status: "in_progress", notes: "Called today" });
    expect(updated.status).toBe("in_progress");

    // Delete
    globalThis.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    const deleted = await client.deleteLead(5);
    expect(deleted.success).toBe(true);
  });

  // Categories CRUD
  it("performs full CRUD on categories", async () => {
    const client = new NinjaCrmClient();

    // Create
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 3, name: "Inbound SMB" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );
    const created = await client.createCategory({ name: "Inbound SMB" });
    expect(created.id).toBe(3);

    // Get
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 3, name: "Inbound SMB" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const fetched = await client.getCategory(3);
    expect(fetched.name).toBe("Inbound SMB");

    // Update
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 3, name: "Mid-Market" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    const updated = await client.updateCategory(3, { name: "Mid-Market" });
    expect(updated.name).toBe("Mid-Market");

    // Delete
    globalThis.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    const deleted = await client.deleteCategory(3);
    expect(deleted.success).toBe(true);
  });

  // Templates CRUD
  it("performs full CRUD on templates", async () => {
    const client = new NinjaCrmClient();

    // Create
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 1, category_id: 3, body: "Hi {{name}} from {{company}}" }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      )
    );
    const created = await client.createTemplate({ category_id: 3, body: "Hi {{name}} from {{company}}" });
    expect(created.id).toBe(1);

    // Get
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 1, category_id: 3, body: "Hi {{name}} from {{company}}" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const fetched = await client.getTemplate(1);
    expect(fetched.body).toContain("{{name}}");

    // Update
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 1, category_id: 3, body: "Hello {{name}}!" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    const updated = await client.updateTemplate(1, { body: "Hello {{name}}!" });
    expect(updated.body).toBe("Hello {{name}}!");

    // Delete
    globalThis.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    const deleted = await client.deleteTemplate(1);
    expect(deleted.success).toBe(true);
  });

  // Workflows
  it("transitions lead status and appends timestamped activity note", async () => {
    const client = new NinjaCrmClient();

    let capturedBody: any;
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 7,
            status: "backlog",
            notes: "Initial qualification note",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockImplementationOnce(async (_url, init) => {
        capturedBody = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            id: 7,
            status: capturedBody.status,
            notes: capturedBody.notes,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      });

    const updated = await client.updateLeadStatus(7, "in_progress", "Sent outreach message via LinkedIn");
    expect(updated.status).toBe("in_progress");
    expect(capturedBody.notes).toContain("Initial qualification note");
    expect(capturedBody.notes).toContain("(Status -> in_progress): Sent outreach message via LinkedIn");
  });

  it("drafts personalized outreach from lead, category, and template", async () => {
    const client = new NinjaCrmClient();

    globalThis.fetch = vi
      .fn()
      // 1. Get lead
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 15,
            category_id: 4,
            notes: "Interested in SOC2 compliance",
            contact: {
              id: 20,
              name: "Dwight Schrute",
              email: "dwight@dundermifflin.com",
              company: "Dunder Mifflin",
              role: "Assistant Regional Manager",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      // 2. Get category
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ id: 4, name: "Enterprise" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      // 3. List templates for category
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 8,
              category_id: 4,
              body: "Hi {{name}}, notice you are {{role}} at {{company}}. Special discount code: {{discount_code}}.",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

    const draft = await client.draftOutreach({
      lead_id: 15,
      custom_variables: { discount_code: "NINJA2026" },
    });

    expect(draft.contact.name).toBe("Dwight Schrute");
    expect(draft.personalized_draft).toBe(
      "Hi Dwight Schrute, notice you are Assistant Regional Manager at Dunder Mifflin. Special discount code: NINJA2026."
    );
    expect(draft.unresolved_variables).toHaveLength(0);
  });

  it("calculates pipeline aggregate stats", async () => {
    const client = new NinjaCrmClient();

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      let count = 0;
      if (url.includes("/api/v1/contacts")) count = 100;
      else if (url.includes("/api/v1/leads?status=backlog")) count = 30;
      else if (url.includes("/api/v1/leads?status=in_progress")) count = 15;
      else if (url.includes("/api/v1/leads?status=done")) count = 10;
      else if (url.includes("/api/v1/leads?status=archived")) count = 5;
      else if (url.includes("/api/v1/leads")) count = 60;
      else if (url.includes("/api/v1/categories")) count = 8;
      else if (url.includes("/api/v1/templates")) count = 6;

      return new Response(JSON.stringify([]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Total-Count": String(count),
        },
      });
    });

    const stats = await client.getStats();
    expect(stats.total_contacts).toBe(100);
    expect(stats.total_leads).toBe(60);
    expect(stats.leads_by_status.backlog).toBe(30);
    expect(stats.leads_by_status.in_progress).toBe(15);
    expect(stats.leads_by_status.done).toBe(10);
    expect(stats.leads_by_status.archived).toBe(5);
    expect(stats.total_categories).toBe(8);
    expect(stats.total_templates).toBe(6);
  });
});
