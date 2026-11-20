import { NinjaCrmApiError } from "../client/ninja-crm-client.js";
import { CreateCategorySchema, CreateContactSchema, CreateLeadSchema, CreateTemplateSchema, DeleteCategorySchema, DeleteContactSchema, DeleteLeadSchema, DeleteTemplateSchema, DraftOutreachSchema, GetCategorySchema, GetContactSchema, GetLeadSchema, GetStatsSchema, GetTemplateSchema, ListCategoriesSchema, ListContactsSchema, ListLeadsSchema, ListTemplatesSchema, UpdateCategorySchema, UpdateContactSchema, UpdateLeadSchema, UpdateLeadStatusSchema, UpdateTemplateSchema, } from "./schemas.js";
function formatError(error) {
    if (error instanceof NinjaCrmApiError) {
        const details = error.details.length > 0 ? `\nDetails:\n${error.details.map((d) => `• ${d}`).join("\n")}` : "";
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: `Ninja CRM API Error [${error.status}]: ${error.message}${details}`,
                },
            ],
        };
    }
    const message = error instanceof Error ? error.message : String(error);
    return {
        isError: true,
        content: [{ type: "text", text: `Ninja CRM Error: ${message}` }],
    };
}
export function registerTools(server, client) {
    // ---------------------------------------------------------
    // Contacts Tools
    // ---------------------------------------------------------
    server.tool("ninja_crm_list_contacts", "List and search contacts in Ninja CRM with query filters, sorting, and pagination", ListContactsSchema, async (params) => {
        try {
            const result = await client.listContacts(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_get_contact", "Get full details for a contact by ID, including any associated lead information", GetContactSchema, async ({ id }) => {
        try {
            const contact = await client.getContact(id);
            return {
                content: [{ type: "text", text: JSON.stringify(contact, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_create_contact", "Create a new contact in Ninja CRM", CreateContactSchema, async (params) => {
        try {
            const contact = await client.createContact(params);
            return {
                content: [{ type: "text", text: JSON.stringify(contact, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_update_contact", "Update an existing contact in Ninja CRM", UpdateContactSchema, async ({ id, ...data }) => {
        try {
            const contact = await client.updateContact(id, data);
            return {
                content: [{ type: "text", text: JSON.stringify(contact, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_delete_contact", "Delete a contact from Ninja CRM", DeleteContactSchema, async ({ id }) => {
        try {
            const result = await client.deleteContact(id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    // ---------------------------------------------------------
    // Leads Tools
    // ---------------------------------------------------------
    server.tool("ninja_crm_list_leads", "List and search leads in Ninja CRM filtered by status ('backlog', 'in_progress', 'done', 'archived'), category, contact, or search term", ListLeadsSchema, async (params) => {
        try {
            const result = await client.listLeads(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_get_lead", "Retrieve complete lead information by ID, including embedded contact and category records", GetLeadSchema, async ({ id }) => {
        try {
            const lead = await client.getLead(id);
            return {
                content: [{ type: "text", text: JSON.stringify(lead, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_create_lead", "Promote an existing contact into a lead, associating them with a category and initial pipeline status", CreateLeadSchema, async (params) => {
        try {
            const lead = await client.createLead(params);
            return {
                content: [{ type: "text", text: JSON.stringify(lead, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_update_lead", "Update a lead record (e.g. modify status, change category, or edit notes)", UpdateLeadSchema, async ({ id, ...data }) => {
        try {
            const lead = await client.updateLead(id, data);
            return {
                content: [{ type: "text", text: JSON.stringify(lead, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_delete_lead", "Delete a lead from Ninja CRM (the underlying contact is preserved)", DeleteLeadSchema, async ({ id }) => {
        try {
            const result = await client.deleteLead(id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    // ---------------------------------------------------------
    // Categories Tools
    // ---------------------------------------------------------
    server.tool("ninja_crm_list_categories", "List outreach categories in Ninja CRM, including indicators if an outreach template is attached", ListCategoriesSchema, async (params) => {
        try {
            const result = await client.listCategories(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_get_category", "Get category details by ID, including its associated outreach template", GetCategorySchema, async ({ id }) => {
        try {
            const category = await client.getCategory(id);
            return {
                content: [{ type: "text", text: JSON.stringify(category, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_create_category", "Create a new lead/outreach category in Ninja CRM", CreateCategorySchema, async (params) => {
        try {
            const category = await client.createCategory(params);
            return {
                content: [{ type: "text", text: JSON.stringify(category, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_update_category", "Update an existing category's name", UpdateCategorySchema, async ({ id, ...data }) => {
        try {
            const category = await client.updateCategory(id, data);
            return {
                content: [{ type: "text", text: JSON.stringify(category, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_delete_category", "Delete a category from Ninja CRM", DeleteCategorySchema, async ({ id }) => {
        try {
            const result = await client.deleteCategory(id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    // ---------------------------------------------------------
    // Templates Tools
    // ---------------------------------------------------------
    server.tool("ninja_crm_list_templates", "List outreach email templates with their category associations and placeholder bodies", ListTemplatesSchema, async (params) => {
        try {
            const result = await client.listTemplates(params);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_get_template", "Retrieve an outreach email template by ID", GetTemplateSchema, async ({ id }) => {
        try {
            const template = await client.getTemplate(id);
            return {
                content: [{ type: "text", text: JSON.stringify(template, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_create_template", "Create a new outreach email template associated with a category", CreateTemplateSchema, async (params) => {
        try {
            const template = await client.createTemplate(params);
            return {
                content: [{ type: "text", text: JSON.stringify(template, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_update_template", "Update the text body of an outreach email template", UpdateTemplateSchema, async ({ id, ...data }) => {
        try {
            const template = await client.updateTemplate(id, data);
            return {
                content: [{ type: "text", text: JSON.stringify(template, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_delete_template", "Delete an outreach template from Ninja CRM", DeleteTemplateSchema, async ({ id }) => {
        try {
            const result = await client.deleteTemplate(id);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    // ---------------------------------------------------------
    // High-Level Domain Workflow Tools
    // ---------------------------------------------------------
    server.tool("ninja_crm_update_lead_status", "Advance or transition a lead's status ('backlog', 'in_progress', 'done', 'archived') and optionally append a timestamped activity note", UpdateLeadStatusSchema, async ({ id, status, note }) => {
        try {
            const updated = await client.updateLeadStatus(id, status, note);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            message: `Lead #${id} transitioned to status '${status}'`,
                            lead: updated,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_draft_outreach", "Generate a personalized outreach email draft by merging contact details, lead history, and the category's outreach template", DraftOutreachSchema, async (params) => {
        try {
            const draft = await client.draftOutreach(params);
            return {
                content: [{ type: "text", text: JSON.stringify(draft, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
    server.tool("ninja_crm_get_stats", "Retrieve aggregate CRM pipeline statistics: total contacts, total leads, breakdown by status, categories, and templates", GetStatsSchema, async () => {
        try {
            const stats = await client.getStats();
            return {
                content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
            };
        }
        catch (err) {
            return formatError(err);
        }
    });
}
//# sourceMappingURL=index.js.map