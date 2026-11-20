import { z } from "zod";
export declare const LeadStatusEnum: z.ZodEnum<["backlog", "in_progress", "done", "archived"]>;
export declare const ListContactsSchema: {
    q: z.ZodOptional<z.ZodString>;
    sort: z.ZodOptional<z.ZodEnum<["name", "email", "company", "role", "created_at", "updated_at"]>>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
};
export declare const GetContactSchema: {
    id: z.ZodNumber;
};
export declare const CreateContactSchema: {
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    linkedin_url: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
};
export declare const UpdateContactSchema: {
    id: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodString>;
    linkedin_url: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
};
export declare const DeleteContactSchema: {
    id: z.ZodNumber;
};
export declare const ListLeadsSchema: {
    status: z.ZodOptional<z.ZodEnum<["backlog", "in_progress", "done", "archived"]>>;
    category_id: z.ZodOptional<z.ZodNumber>;
    contact_id: z.ZodOptional<z.ZodNumber>;
    q: z.ZodOptional<z.ZodString>;
    sort: z.ZodOptional<z.ZodEnum<["status", "created_at", "updated_at"]>>;
    order: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
};
export declare const GetLeadSchema: {
    id: z.ZodNumber;
};
export declare const CreateLeadSchema: {
    contact_id: z.ZodNumber;
    category_id: z.ZodOptional<z.ZodNumber>;
    new_category_name: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["backlog", "in_progress", "done", "archived"]>>;
    notes: z.ZodOptional<z.ZodString>;
};
export declare const UpdateLeadSchema: {
    id: z.ZodNumber;
    category_id: z.ZodOptional<z.ZodNumber>;
    new_category_name: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["backlog", "in_progress", "done", "archived"]>>;
    notes: z.ZodOptional<z.ZodString>;
};
export declare const DeleteLeadSchema: {
    id: z.ZodNumber;
};
export declare const ListCategoriesSchema: {
    q: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
};
export declare const GetCategorySchema: {
    id: z.ZodNumber;
};
export declare const CreateCategorySchema: {
    name: z.ZodString;
};
export declare const UpdateCategorySchema: {
    id: z.ZodNumber;
    name: z.ZodString;
};
export declare const DeleteCategorySchema: {
    id: z.ZodNumber;
};
export declare const ListTemplatesSchema: {
    category_id: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
};
export declare const GetTemplateSchema: {
    id: z.ZodNumber;
};
export declare const CreateTemplateSchema: {
    body: z.ZodString;
    category_id: z.ZodOptional<z.ZodNumber>;
    new_category_name: z.ZodOptional<z.ZodString>;
};
export declare const UpdateTemplateSchema: {
    id: z.ZodNumber;
    body: z.ZodString;
};
export declare const DeleteTemplateSchema: {
    id: z.ZodNumber;
};
export declare const UpdateLeadStatusSchema: {
    id: z.ZodNumber;
    status: z.ZodEnum<["backlog", "in_progress", "done", "archived"]>;
    note: z.ZodOptional<z.ZodString>;
};
export declare const DraftOutreachSchema: {
    lead_id: z.ZodOptional<z.ZodNumber>;
    contact_id: z.ZodOptional<z.ZodNumber>;
    category_id: z.ZodOptional<z.ZodNumber>;
    custom_variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
};
export declare const GetStatsSchema: {};
//# sourceMappingURL=schemas.d.ts.map