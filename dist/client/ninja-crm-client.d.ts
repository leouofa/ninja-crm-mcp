import type { Category, CategoryInput, Contact, ContactInput, CrmStats, Lead, LeadInput, LeadStatus, ListCategoriesParams, ListContactsParams, ListLeadsParams, ListTemplatesParams, OutreachDraftResult, PaginatedResult, Template, TemplateInput } from "../types/index.js";
export interface NinjaCrmClientOptions {
    baseUrl?: string;
    apiKey?: string;
    timeoutMs?: number;
}
export declare class NinjaCrmApiError extends Error {
    readonly status: number;
    readonly details: string[];
    constructor(status: number, message: string, details?: string[]);
}
export declare class NinjaCrmClient {
    private readonly baseUrl;
    private readonly apiKey?;
    private readonly timeoutMs;
    constructor(options?: NinjaCrmClientOptions);
    getBaseUrl(): string;
    private rawRequest;
    private request;
    private paginatedRequest;
    getOpenApiSpec(): Promise<Record<string, unknown>>;
    listContacts(params?: ListContactsParams): Promise<PaginatedResult<Contact>>;
    getContact(id: number): Promise<Contact>;
    createContact(data: ContactInput): Promise<Contact>;
    updateContact(id: number, data: Partial<ContactInput>): Promise<Contact>;
    deleteContact(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    listLeads(params?: ListLeadsParams): Promise<PaginatedResult<Lead>>;
    getLead(id: number): Promise<Lead>;
    createLead(data: LeadInput): Promise<Lead>;
    updateLead(id: number, data: Partial<LeadInput>): Promise<Lead>;
    deleteLead(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    listCategories(params?: ListCategoriesParams): Promise<PaginatedResult<Category>>;
    getCategory(id: number): Promise<Category>;
    createCategory(data: CategoryInput): Promise<Category>;
    updateCategory(id: number, data: Partial<CategoryInput>): Promise<Category>;
    deleteCategory(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    listTemplates(params?: ListTemplatesParams): Promise<PaginatedResult<Template>>;
    getTemplate(id: number): Promise<Template>;
    createTemplate(data: TemplateInput): Promise<Template>;
    updateTemplate(id: number, data: Partial<TemplateInput>): Promise<Template>;
    deleteTemplate(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    updateLeadStatus(id: number, status: LeadStatus, noteAppend?: string): Promise<Lead>;
    draftOutreach(params: {
        lead_id?: number;
        contact_id?: number;
        category_id?: number;
        custom_variables?: Record<string, string>;
    }): Promise<OutreachDraftResult>;
    getStats(): Promise<CrmStats>;
}
//# sourceMappingURL=ninja-crm-client.d.ts.map