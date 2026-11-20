import type {
  Category,
  CategoryInput,
  Contact,
  ContactInput,
  CrmStats,
  Lead,
  LeadInput,
  LeadStatus,
  ListCategoriesParams,
  ListContactsParams,
  ListLeadsParams,
  ListTemplatesParams,
  OutreachDraftResult,
  PaginatedResult,
  PaginationMeta,
  Template,
  TemplateInput,
} from "../types/index.js";

export interface NinjaCrmClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export class NinjaCrmApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = "NinjaCrmApiError";
    this.status = status;
    this.details = details;
  }
}

interface RequestResult<T> {
  data: T;
  headers: Headers;
  meta: PaginationMeta;
}

export class NinjaCrmClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(options: NinjaCrmClientOptions = {}) {
    const rawUrl = options.baseUrl || process.env.NINJA_CRM_API_URL || "http://localhost:3000";
    this.baseUrl = rawUrl.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
    this.apiKey = options.apiKey || process.env.NINJA_CRM_API_KEY;
    this.timeoutMs =
      options.timeoutMs ??
      (process.env.NINJA_CRM_TIMEOUT_MS ? Number.parseInt(process.env.NINJA_CRM_TIMEOUT_MS, 10) : 30000);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async rawRequest<T>(path: string, options: RequestInit = {}): Promise<RequestResult<T>> {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${this.baseUrl}${cleanPath}`;
    const headers = new Headers(options.headers);

    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    if (this.apiKey && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        if (isJson) {
          const errorBody = (await response.json()) as { error?: string; errors?: string[] };
          const message = errorBody.error || `HTTP ${response.status} ${response.statusText}`;
          const details = Array.isArray(errorBody.errors)
            ? errorBody.errors
            : errorBody.error
              ? [errorBody.error]
              : [];
          throw new NinjaCrmApiError(response.status, message, details);
        }
        const text = await response.text();
        throw new NinjaCrmApiError(response.status, text || `HTTP ${response.status} ${response.statusText}`);
      }

      let data: T;
      if (response.status === 204) {
        data = {} as T;
      } else if (isJson) {
        data = (await response.json()) as T;
      } else {
        data = (await response.text()) as unknown as T;
      }

      const totalCount = Number.parseInt(response.headers.get("X-Total-Count") || "0", 10);
      const limit = Number.parseInt(response.headers.get("X-Limit") || "50", 10);
      const offset = Number.parseInt(response.headers.get("X-Offset") || "0", 10);

      const meta: PaginationMeta = {
        total_count: Number.isNaN(totalCount) ? 0 : totalCount,
        limit: Number.isNaN(limit) ? 50 : limit,
        offset: Number.isNaN(offset) ? 0 : offset,
      };

      return { data, headers: response.headers, meta };
    } catch (err: unknown) {
      if (err instanceof NinjaCrmApiError) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new NinjaCrmApiError(408, `Ninja CRM API request timed out after ${this.timeoutMs}ms`);
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new NinjaCrmApiError(0, `Ninja CRM API network error connecting to ${url}: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const { data } = await this.rawRequest<T>(path, options);
    return data;
  }

  private async paginatedRequest<T>(path: string, queryParams: Record<string, unknown> = {}): Promise<PaginatedResult<T>> {
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== "") {
        urlParams.set(key, String(value));
      }
    }

    const queryStr = urlParams.toString();
    const fullPath = queryStr ? `${path}?${queryStr}` : path;
    const { data, meta } = await this.rawRequest<T[]>(fullPath);

    return {
      items: Array.isArray(data) ? data : [],
      meta: {
        total_count: meta.total_count || (Array.isArray(data) ? data.length : 0),
        limit: meta.limit,
        offset: meta.offset,
      },
    };
  }

  // OpenAPI Spec
  async getOpenApiSpec(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/api/v1/openapi.json");
  }

  // Contacts API
  async listContacts(params: ListContactsParams = {}): Promise<PaginatedResult<Contact>> {
    return this.paginatedRequest<Contact>("/api/v1/contacts", params as Record<string, unknown>);
  }

  async getContact(id: number): Promise<Contact> {
    return this.request<Contact>(`/api/v1/contacts/${id}`);
  }

  async createContact(data: ContactInput): Promise<Contact> {
    return this.request<Contact>("/api/v1/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateContact(id: number, data: Partial<ContactInput>): Promise<Contact> {
    return this.request<Contact>(`/api/v1/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: number): Promise<{ success: boolean; message: string }> {
    await this.request<unknown>(`/api/v1/contacts/${id}`, { method: "DELETE" });
    return { success: true, message: `Contact #${id} deleted successfully` };
  }

  // Leads API
  async listLeads(params: ListLeadsParams = {}): Promise<PaginatedResult<Lead>> {
    return this.paginatedRequest<Lead>("/api/v1/leads", params as Record<string, unknown>);
  }

  async getLead(id: number): Promise<Lead> {
    return this.request<Lead>(`/api/v1/leads/${id}`);
  }

  async createLead(data: LeadInput): Promise<Lead> {
    return this.request<Lead>("/api/v1/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: number, data: Partial<LeadInput>): Promise<Lead> {
    return this.request<Lead>(`/api/v1/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteLead(id: number): Promise<{ success: boolean; message: string }> {
    await this.request<unknown>(`/api/v1/leads/${id}`, { method: "DELETE" });
    return { success: true, message: `Lead #${id} deleted successfully` };
  }

  // Categories API
  async listCategories(params: ListCategoriesParams = {}): Promise<PaginatedResult<Category>> {
    return this.paginatedRequest<Category>("/api/v1/categories", params as Record<string, unknown>);
  }

  async getCategory(id: number): Promise<Category> {
    return this.request<Category>(`/api/v1/categories/${id}`);
  }

  async createCategory(data: CategoryInput): Promise<Category> {
    return this.request<Category>("/api/v1/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: Partial<CategoryInput>): Promise<Category> {
    return this.request<Category>(`/api/v1/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
    await this.request<unknown>(`/api/v1/categories/${id}`, { method: "DELETE" });
    return { success: true, message: `Category #${id} deleted successfully` };
  }

  // Templates API
  async listTemplates(params: ListTemplatesParams = {}): Promise<PaginatedResult<Template>> {
    return this.paginatedRequest<Template>("/api/v1/templates", params as Record<string, unknown>);
  }

  async getTemplate(id: number): Promise<Template> {
    return this.request<Template>(`/api/v1/templates/${id}`);
  }

  async createTemplate(data: TemplateInput): Promise<Template> {
    return this.request<Template>("/api/v1/templates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: number, data: Partial<TemplateInput>): Promise<Template> {
    return this.request<Template>(`/api/v1/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id: number): Promise<{ success: boolean; message: string }> {
    await this.request<unknown>(`/api/v1/templates/${id}`, { method: "DELETE" });
    return { success: true, message: `Template #${id} deleted successfully` };
  }

  // High-level Domain Workflow Helpers
  async updateLeadStatus(id: number, status: LeadStatus, noteAppend?: string): Promise<Lead> {
    const currentLead = await this.getLead(id);
    let updatedNotes = currentLead.notes || "";
    if (noteAppend && noteAppend.trim().length > 0) {
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
      const noteEntry = `\n[${timestamp}] (Status -> ${status}): ${noteAppend.trim()}`;
      updatedNotes = updatedNotes ? `${updatedNotes}\n${noteEntry}` : noteEntry.trim();
    }

    return this.updateLead(id, {
      status,
      notes: updatedNotes,
    });
  }

  async draftOutreach(params: {
    lead_id?: number;
    contact_id?: number;
    category_id?: number;
    custom_variables?: Record<string, string>;
  }): Promise<OutreachDraftResult> {
    let contact: Contact;
    let categoryId: number;
    let leadNotes = "";

    if (params.lead_id) {
      const lead = await this.getLead(params.lead_id);
      if (!lead.contact) {
        throw new NinjaCrmApiError(404, `Lead #${params.lead_id} does not have an associated contact`);
      }
      contact = lead.contact;
      categoryId = lead.category_id;
      leadNotes = lead.notes || "";
    } else if (params.contact_id && params.category_id) {
      contact = await this.getContact(params.contact_id);
      categoryId = params.category_id;
    } else {
      throw new NinjaCrmApiError(400, "Either lead_id or both contact_id and category_id must be provided");
    }

    // Fetch category and its associated template
    const category = await this.getCategory(categoryId);
    const templateResult = await this.listTemplates({ category_id: categoryId, limit: 1 });
    if (templateResult.items.length === 0) {
      throw new NinjaCrmApiError(404, `No outreach template configured for category '${category.name}' (#${categoryId})`);
    }
    const template = templateResult.items[0];

    // Standard variable mapping
    const variableMap: Record<string, string> = {
      name: contact.name || "",
      contact_name: contact.name || "",
      first_name: contact.name?.split(" ")[0] || "",
      last_name: contact.name?.split(" ").slice(1).join(" ") || "",
      email: contact.email || "",
      company: contact.company || "",
      role: contact.role || "",
      linkedin_url: contact.linkedin_url || "",
      category: category.name || "",
      lead_notes: leadNotes,
      contact_notes: contact.notes || "",
      ...(params.custom_variables || {}),
    };

    // Substitute {{variable}} placeholders
    let draft = template.body;
    const unresolved: string[] = [];
    const regex = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g;

    draft = draft.replace(regex, (fullMatch, varName) => {
      const val = variableMap[varName.toLowerCase()] ?? variableMap[varName];
      if (val !== undefined && val !== null && val !== "") {
        return val;
      }
      unresolved.push(varName);
      return fullMatch;
    });

    return {
      lead_id: params.lead_id,
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        role: contact.role,
        notes: contact.notes,
      },
      category: {
        id: category.id,
        name: category.name,
      },
      template: {
        id: template.id,
        body: template.body,
      },
      personalized_draft: draft,
      unresolved_variables: Array.from(new Set(unresolved)),
    };
  }

  // System Stats calculation
  async getStats(): Promise<CrmStats> {
    const [
      contactsRes,
      leadsAllRes,
      leadsBacklogRes,
      leadsInProgressRes,
      leadsDoneRes,
      leadsArchivedRes,
      categoriesRes,
      templatesRes,
    ] = await Promise.all([
      this.listContacts({ limit: 1 }),
      this.listLeads({ limit: 1 }),
      this.listLeads({ status: "backlog", limit: 1 }),
      this.listLeads({ status: "in_progress", limit: 1 }),
      this.listLeads({ status: "done", limit: 1 }),
      this.listLeads({ status: "archived", limit: 1 }),
      this.listCategories({ limit: 1 }),
      this.listTemplates({ limit: 1 }),
    ]);

    return {
      total_contacts: contactsRes.meta.total_count,
      total_leads: leadsAllRes.meta.total_count,
      total_categories: categoriesRes.meta.total_count,
      total_templates: templatesRes.meta.total_count,
      leads_by_status: {
        backlog: leadsBacklogRes.meta.total_count,
        in_progress: leadsInProgressRes.meta.total_count,
        done: leadsDoneRes.meta.total_count,
        archived: leadsArchivedRes.meta.total_count,
      },
    };
  }
}
