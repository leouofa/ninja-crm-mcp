import { z } from "zod";
export const LeadStatusEnum = z.enum(["backlog", "in_progress", "done", "archived"]);
// Contacts
export const ListContactsSchema = {
    q: z.string().optional().describe("Search keyword matching name, email, company, or role"),
    sort: z.enum(["name", "email", "company", "role", "created_at", "updated_at"]).optional().describe("Field to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order: 'asc' or 'desc'"),
    limit: z.number().int().min(1).max(100).optional().describe("Max number of contacts to return (default 50)"),
    offset: z.number().int().min(0).optional().describe("Offset from start of results (default 0)"),
};
export const GetContactSchema = {
    id: z.number().int().describe("The ID of the contact to retrieve"),
};
export const CreateContactSchema = {
    name: z.string().min(1).describe("Full name of the contact"),
    email: z.string().email().optional().describe("Email address"),
    phone: z.string().optional().describe("Phone number"),
    company: z.string().optional().describe("Company or organization name"),
    role: z.string().optional().describe("Job title or role"),
    linkedin_url: z.string().url().optional().describe("LinkedIn profile URL"),
    notes: z.string().optional().describe("Freeform notes or background info about the contact"),
};
export const UpdateContactSchema = {
    id: z.number().int().describe("The ID of the contact to update"),
    name: z.string().min(1).optional().describe("Full name of the contact"),
    email: z.string().email().optional().describe("Email address"),
    phone: z.string().optional().describe("Phone number"),
    company: z.string().optional().describe("Company or organization name"),
    role: z.string().optional().describe("Job title or role"),
    linkedin_url: z.string().url().optional().describe("LinkedIn profile URL"),
    notes: z.string().optional().describe("Freeform notes or background info about the contact"),
};
export const DeleteContactSchema = {
    id: z.number().int().describe("The ID of the contact to delete"),
};
// Leads
export const ListLeadsSchema = {
    status: LeadStatusEnum.optional().describe("Filter by lead status: 'backlog', 'in_progress', 'done', 'archived'"),
    category_id: z.number().int().optional().describe("Filter leads by category ID"),
    contact_id: z.number().int().optional().describe("Filter leads by contact ID"),
    q: z.string().optional().describe("Search keyword matching contact name, company, category name, or lead notes"),
    sort: z.enum(["status", "created_at", "updated_at"]).optional().describe("Field to sort by"),
    order: z.enum(["asc", "desc"]).optional().describe("Sort order: 'asc' or 'desc'"),
    limit: z.number().int().min(1).max(100).optional().describe("Max number of leads to return (default 50)"),
    offset: z.number().int().min(0).optional().describe("Offset from start of results (default 0)"),
};
export const GetLeadSchema = {
    id: z.number().int().describe("The ID of the lead to retrieve"),
};
export const CreateLeadSchema = {
    contact_id: z.number().int().describe("The ID of the contact to promote to lead"),
    category_id: z.number().int().optional().describe("The ID of an existing category"),
    new_category_name: z.string().optional().describe("Name of a new category to create on the fly"),
    status: LeadStatusEnum.optional().describe("Initial lead status (default 'backlog')"),
    notes: z.string().optional().describe("Initial lead notes or qualification summary"),
};
export const UpdateLeadSchema = {
    id: z.number().int().describe("The ID of the lead to update"),
    category_id: z.number().int().optional().describe("Update category by ID"),
    new_category_name: z.string().optional().describe("Assign or create a new category on the fly"),
    status: LeadStatusEnum.optional().describe("Update lead status ('backlog', 'in_progress', 'done', 'archived')"),
    notes: z.string().optional().describe("Update lead notes"),
};
export const DeleteLeadSchema = {
    id: z.number().int().describe("The ID of the lead to delete"),
};
// Categories
export const ListCategoriesSchema = {
    q: z.string().optional().describe("Search keyword matching category name"),
    limit: z.number().int().min(1).max(100).optional().describe("Max number of categories to return (default 50)"),
    offset: z.number().int().min(0).optional().describe("Offset from start of results (default 0)"),
};
export const GetCategorySchema = {
    id: z.number().int().describe("The ID of the category to retrieve"),
};
export const CreateCategorySchema = {
    name: z.string().min(1).describe("Name of the new category"),
};
export const UpdateCategorySchema = {
    id: z.number().int().describe("The ID of the category to update"),
    name: z.string().min(1).describe("New name of the category"),
};
export const DeleteCategorySchema = {
    id: z.number().int().describe("The ID of the category to delete"),
};
// Templates
export const ListTemplatesSchema = {
    category_id: z.number().int().optional().describe("Filter templates by category ID"),
    limit: z.number().int().min(1).max(100).optional().describe("Max number of templates to return (default 50)"),
    offset: z.number().int().min(0).optional().describe("Offset from start of results (default 0)"),
};
export const GetTemplateSchema = {
    id: z.number().int().describe("The ID of the template to retrieve"),
};
export const CreateTemplateSchema = {
    body: z.string().min(1).describe("Template email copy with {{variable}} placeholders (e.g. {{name}}, {{company}}, {{role}})"),
    category_id: z.number().int().optional().describe("The ID of the category this template belongs to"),
    new_category_name: z.string().optional().describe("Create and associate with a new category name on the fly"),
};
export const UpdateTemplateSchema = {
    id: z.number().int().describe("The ID of the template to update"),
    body: z.string().min(1).describe("Updated template copy with {{variable}} placeholders"),
};
export const DeleteTemplateSchema = {
    id: z.number().int().describe("The ID of the template to delete"),
};
// High-level Domain Workflows
export const UpdateLeadStatusSchema = {
    id: z.number().int().describe("The ID of the lead whose status to change"),
    status: LeadStatusEnum.describe("New lead status: 'backlog', 'in_progress', 'done', or 'archived'"),
    note: z.string().optional().describe("Optional progress note to append with timestamp"),
};
export const DraftOutreachSchema = {
    lead_id: z.number().int().optional().describe("The ID of the lead to generate outreach for"),
    contact_id: z.number().int().optional().describe("Contact ID (if drafting directly without a lead record)"),
    category_id: z.number().int().optional().describe("Category ID (if drafting directly without a lead record)"),
    custom_variables: z
        .record(z.string())
        .optional()
        .describe("Optional key-value pairs to override or populate custom variables in the template"),
};
export const GetStatsSchema = {};
//# sourceMappingURL=schemas.js.map