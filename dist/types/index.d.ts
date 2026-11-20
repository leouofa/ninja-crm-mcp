import type { components } from "./ninja-api.js";
export type Contact = components["schemas"]["Contact"];
export type ContactInput = components["schemas"]["ContactInput"];
export type Lead = components["schemas"]["Lead"];
export type LeadInput = components["schemas"]["LeadInput"];
export type Category = components["schemas"]["Category"];
export type CategoryInput = components["schemas"]["CategoryInput"];
export type Template = components["schemas"]["Template"];
export type TemplateInput = components["schemas"]["TemplateInput"];
export type ApiErrorResponse = components["schemas"]["Error"];
export type ApiValidationErrorResponse = components["schemas"]["ValidationError"];
export type LeadStatus = "backlog" | "in_progress" | "done" | "archived";
export interface PaginationMeta {
    total_count: number;
    limit: number;
    offset: number;
}
export interface PaginatedResult<T> {
    items: T[];
    meta: PaginationMeta;
}
export interface ListContactsParams {
    q?: string;
    sort?: string;
    order?: "asc" | "desc";
    limit?: number;
    offset?: number;
}
export interface ListLeadsParams {
    status?: LeadStatus | string;
    category_id?: number;
    contact_id?: number;
    q?: string;
    sort?: string;
    order?: "asc" | "desc";
    limit?: number;
    offset?: number;
}
export interface ListCategoriesParams {
    q?: string;
    limit?: number;
    offset?: number;
}
export interface ListTemplatesParams {
    category_id?: number;
    limit?: number;
    offset?: number;
}
export interface CrmStats {
    total_contacts: number;
    total_leads: number;
    total_categories: number;
    total_templates: number;
    leads_by_status: {
        backlog: number;
        in_progress: number;
        done: number;
        archived: number;
    };
}
export interface OutreachDraftResult {
    lead_id?: number;
    contact: {
        id: number;
        name: string;
        email?: string | null;
        company?: string | null;
        role?: string | null;
        notes?: string | null;
    };
    category: {
        id: number;
        name: string;
    };
    template: {
        id: number;
        body: string;
    };
    personalized_draft: string;
    unresolved_variables: string[];
}
//# sourceMappingURL=index.d.ts.map