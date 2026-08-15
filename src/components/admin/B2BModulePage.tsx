"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { calculateGeoScore, calculateSeoScore, normalizeGeneratedArticle, normalizeKeywordList, stripResearchLinks } from "@/lib/content-quality";
import {
  AlertTriangle, BookOpen, CheckCircle2, ChevronRight, Download, Edit3, FileUp, Filter, Gauge, Globe2, Plus, RefreshCw,
  Search, Send, Sparkles, Tag, Trash2, UploadCloud, X,
} from "lucide-react";

type Row = Record<string, any>;
type FieldType = "text" | "textarea" | "select" | "number" | "date" | "datetime" | "email" | "url" | "array" | "json" | "checkbox" | "file";
type Field = { key: string; label: string; type?: FieldType; options?: string[]; required?: boolean; placeholder?: string; full?: boolean; readOnly?: boolean; defaultValue?: any };
type Column = { key: string; label: string; secondaryKey?: string };
type Tab = { label: string; value: string };
type FilterRule = { key: string; op: "eq" | "neq"; value: string };
type ModuleConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  explanation?: string;
  table: string;
  primaryAction: string;
  fields: Field[];
  columns: Column[];
  statusKey?: string;
  tabs?: Tab[];
  filter?: FilterRule;
  readOnly?: boolean;
  orderKey?: string;
  migrationRequired?: boolean;
  defaults?: Record<string, any>;
};

const leadStages = ["New Inquiry", "Contacted", "Qualified", "Warm Lead", "Sample Requested", "Sample Sent", "Quotation Requested", "Quotation Sent", "Quotation Viewed", "Follow-Up Due", "Negotiation", "Waiting Reply", "Won", "Future Opportunity", "Dormant", "Lost"];
const approvalStatuses = ["Draft", "Needs Review", "Changes Requested", "Approved", "Scheduled", "Published", "Rejected"];

const configs: Record<string, ModuleConfig> = {
  "blog-center": {
    eyebrow: "AI content operations", title: "Blog Center", subtitle: "Plan, edit, review and publish real blog records stored in Supabase.", table: "blog_posts", primaryAction: "Create Blog",
    columns: [{ key: "title", label: "Title" }, { key: "featured_image", label: "Image" }, { key: "content_type", label: "Type" }, { key: "target_country", label: "Target Country" }, { key: "reading_time", label: "Reading Time" }, { key: "primary_keyword", label: "Primary Keyword" }, { key: "seo_score", label: "SEO Score" }, { key: "geo_score", label: "GEO Score" }, { key: "status", label: "Status" }, { key: "scheduled_at", label: "Scheduled" }, { key: "updated_at", label: "Updated" }],
    fields: [{ key: "title", label: "Title", required: true, full: true }, { key: "slug", label: "Slug", required: true }, { key: "content_type", label: "Content Type", type: "select", options: ["blog", "article"] }, { key: "target_country", label: "Target Country" }, { key: "category", label: "Category" }, { key: "primary_keyword", label: "Primary Keyword" }, { key: "keywords", label: "Secondary Keywords", type: "array", full: true }, { key: "excerpt", label: "Excerpt", type: "textarea", full: true }, { key: "content", label: "Article Content", type: "textarea", full: true }, { key: "featured_image", label: "Featured Image URL", type: "file", full: true }, { key: "seo_title", label: "SEO Title", full: true }, { key: "seo_description", label: "SEO Description", type: "textarea", full: true }, { key: "seo_score", label: "SEO Score", type: "number" }, { key: "geo_score", label: "GEO Score", type: "number" }, { key: "reading_time", label: "Reading Time" }, { key: "image_prompt", label: "Featured Image Prompt", type: "textarea", full: true }, { key: "internal_links", label: "Internal Link Suggestions", type: "json", full: true }, { key: "status", label: "Status", type: "select", options: ["draft", "review", "approved", "scheduled", "published", "archived"] }, { key: "scheduled_at", label: "Scheduled For", type: "datetime" }, { key: "published_at", label: "Published At", type: "datetime" }],
    statusKey: "status", tabs: [{ label: "All Posts", value: "all" }, { label: "AI Drafts", value: "draft" }, { label: "In Review", value: "review" }, { label: "Approved", value: "approved" }, { label: "Scheduled", value: "scheduled" }, { label: "Published", value: "published" }, { label: "Archived", value: "archived" }], defaults: { content_type: "blog", status: "draft", approval_status: "Draft" },
  },
  "faq-intelligence": {
    eyebrow: "Buyer question intelligence", title: "FAQ Intelligence", subtitle: "Review buyer questions and approve answers before publishing.", table: "faq_research_questions", primaryAction: "Create FAQ Suggestion", migrationRequired: true,
    columns: [{ key: "question", label: "Question" }, { key: "source", label: "Source" }, { key: "demand_score", label: "Demand" }, { key: "target_country", label: "Country" }, { key: "related_keyword", label: "Keyword" }, { key: "recommended_category", label: "Category" }, { key: "status", label: "Status" }],
    fields: [{ key: "question", label: "Question", required: true, type: "textarea", full: true }, { key: "source", label: "Source", type: "select", options: ["Google Search Trends", "People Also Ask", "Google Search Console", "ChatGPT-style Buyer Questions", "Gemini-style Buyer Questions", "Website Search", "Lead Team Notes"] }, { key: "source_mode", label: "Source Connection", type: "select", options: ["Live", "Connection Required"] }, { key: "demand_score", label: "Demand Score", type: "number" }, { key: "target_country", label: "Target Country" }, { key: "related_keyword", label: "Related Keyword" }, { key: "recommended_category", label: "Recommended Category" }, { key: "ai_answer", label: "SEO Optimized Answer", type: "textarea", full: true }, { key: "schema_preview", label: "Suggested Schema", type: "json", full: true }, { key: "internal_links", label: "Internal Links", type: "json", full: true }, { key: "reference_notes", label: "Reference Notes", type: "textarea", full: true }, { key: "status", label: "Status", type: "select", options: ["New Suggestion", "In Review", "Approved", "Published", "Rejected"] }],
    statusKey: "status", tabs: [{ label: "Trending Questions", value: "all" }, { label: "New Suggestions", value: "New Suggestion" }, { label: "In Review", value: "In Review" }, { label: "Approved", value: "Approved" }, { label: "Published", value: "Published" }, { label: "Rejected", value: "Rejected" }],
  },
  outreach: {
    eyebrow: "Authority and relationship building", title: "Outreach & Backlink Intelligence", subtitle: "Store and manage genuine B2B link opportunities and follow-ups.", table: "outreach_opportunities", primaryAction: "Add Opportunity", migrationRequired: true,
    columns: [{ key: "website", label: "Website" }, { key: "country", label: "Country" }, { key: "opportunity_type", label: "Type" }, { key: "authority_score", label: "Authority" }, { key: "relevance_score", label: "Relevance" }, { key: "contact_person", label: "Contact" }, { key: "status", label: "Status" }, { key: "follow_up_date", label: "Follow-Up" }],
    fields: [{ key: "website", label: "Website", type: "url", required: true, full: true }, { key: "country", label: "Country" }, { key: "opportunity_type", label: "Type", type: "select", options: ["Importer Directory", "Distributor Directory", "Food Industry Publication", "Packaging Publication", "Trade Fair", "Chamber of Commerce", "Industry Association", "Guest Article", "Supplier Listing"] }, { key: "authority_score", label: "Authority Score", type: "number" }, { key: "relevance_score", label: "Relevance Score", type: "number" }, { key: "contact_person", label: "Contact Person" }, { key: "contact_email", label: "Email", type: "email" }, { key: "status", label: "Status", type: "select", options: ["Identified", "Contacted", "Replied", "Negotiating", "Link Live", "Declined", "Follow Up"] }, { key: "last_contact_at", label: "Last Contact", type: "datetime" }, { key: "follow_up_date", label: "Follow-Up Date", type: "date" }, { key: "notes", label: "Notes", type: "textarea", full: true }], statusKey: "status",
  },
  certifications: {
    eyebrow: "Quality and compliance", title: "Certifications", subtitle: "Manage actual ISO, HACCP, Halal, SEDEX, lab reports, COA and export records.", table: "certifications", primaryAction: "Upload Certification", migrationRequired: true,
    columns: [{ key: "document_name", label: "Document" }, { key: "category", label: "Category" }, { key: "issuing_authority", label: "Issuing Authority" }, { key: "certificate_number", label: "Certificate Number" }, { key: "applicable_markets", label: "Markets" }, { key: "expiry_date", label: "Expiry" }, { key: "visibility", label: "Visibility" }, { key: "status", label: "Status" }],
    fields: [{ key: "document_name", label: "Document Name", required: true, full: true }, { key: "category", label: "Category", type: "select", options: ["ISO", "HACCP", "Halal", "Kosher", "FDA-Related Records", "SEDEX", "Social Compliance", "Lab Reports", "COA", "MSDS", "Certificate of Origin", "Product Specifications", "Quality Documents"] }, { key: "issuing_authority", label: "Issuing Authority" }, { key: "certificate_number", label: "Certificate Number" }, { key: "issue_date", label: "Issue Date", type: "date" }, { key: "expiry_date", label: "Expiry Date", type: "date" }, { key: "applicable_products", label: "Applicable Products", type: "array" }, { key: "applicable_markets", label: "Applicable Markets", type: "array" }, { key: "visibility", label: "Visibility", type: "select", options: ["Public", "Private"] }, { key: "file_url", label: "Certificate File", type: "file", full: true }, { key: "expiry_reminder_days", label: "Expiry Reminder Days", type: "number" }, { key: "status", label: "Status", type: "select", options: ["Valid", "Expiring Soon", "Expired", "Draft", "Under Review"] }, { key: "notes", label: "Notes", type: "textarea", full: true }], statusKey: "status",
  },
  forms: {
    eyebrow: "Website lead capture", title: "Forms", subtitle: "Create and manage website forms. Every real submission can create a lead and notify the assigned team member.", explanation: "Form definitions are stored in Supabase. Website submissions continue to enter the live inquiries table and appear in Leads.", table: "website_forms", primaryAction: "Create Form", migrationRequired: true,
    columns: [{ key: "name", label: "Form" }, { key: "form_type", label: "Type" }, { key: "website_placement", label: "Website Placement" }, { key: "submission_count", label: "Submissions" }, { key: "last_submission_at", label: "Last Submission" }, { key: "status", label: "Status" }],
    fields: [{ key: "name", label: "Form Name", required: true, full: true }, { key: "form_type", label: "Template", type: "select", options: ["Contact Form", "General Inquiry", "Request for Quotation", "Request Sample", "Become a Distributor", "Private Label Inquiry", "Bulk Supply Inquiry", "Download Catalogue", "Ask a Product Question"] }, { key: "website_placement", label: "Website Placement" }, { key: "fields", label: "Field Configuration", type: "json", full: true, defaultValue: [{ name: "name", required: true }, { name: "company", required: true }, { name: "email", required: true }, { name: "country", required: true }, { name: "message", required: true }] }, { key: "notifications", label: "Notification Settings", type: "json", full: true }, { key: "status", label: "Status", type: "select", options: ["Draft", "Live", "Paused", "Archived"] }], statusKey: "status",
  },
  leads: {
    eyebrow: "B2B lead lifecycle", title: "Leads", subtitle: "Manage real website inquiries, RFQs, follow-ups and lead lifecycle records.", table: "inquiries", primaryAction: "Add Lead", migrationRequired: true,
    columns: [{ key: "name", label: "Person", secondaryKey: "email" }, { key: "company", label: "Company" }, { key: "country", label: "Country" }, { key: "buyer_type", label: "Buyer Type" }, { key: "product", label: "Product Interest" }, { key: "estimated_volume", label: "Estimated Volume" }, { key: "lead_source", label: "Lead Source" }, { key: "lifecycle_stage", label: "Lifecycle Stage" }, { key: "lead_temperature", label: "Temperature" }, { key: "last_contact_at", label: "Last Contact" }, { key: "next_follow_up_at", label: "Next Follow-Up" }],
    fields: [{ key: "name", label: "Contact Name", required: true, full: true }, { key: "company", label: "Company" }, { key: "email", label: "Email", type: "email", required: true }, { key: "whatsapp", label: "Phone / WhatsApp" }, { key: "country", label: "Country" }, { key: "buyer_type", label: "Buyer Type", type: "select", options: ["Importer", "Distributor", "Wholesaler", "Private Label Brand", "Food Manufacturer", "Retail Chain", "Hospitality Buyer"] }, { key: "product", label: "Product Interest" }, { key: "quantity", label: "Requested Quantity" }, { key: "packaging_requirement", label: "Packaging Requirement", type: "textarea", full: true }, { key: "estimated_volume", label: "Estimated Volume" }, { key: "lead_source", label: "Lead Source", type: "select", options: ["Organic Search", "LinkedIn", "RFQ Form", "WhatsApp", "Email", "Trade Fair", "Distributor Referral", "Catalogue Download", "Website Inquiry"] }, { key: "lifecycle_stage", label: "Lifecycle Stage", type: "select", options: leadStages }, { key: "lead_temperature", label: "Lead Temperature", type: "select", options: ["New", "Cold", "Warm", "Hot", "Won", "Lost"] }, { key: "last_contact_at", label: "Last Contact", type: "datetime" }, { key: "next_follow_up_at", label: "Next Follow-Up", type: "datetime" }, { key: "message", label: "Inquiry Message", type: "textarea", full: true }, { key: "notes", label: "Internal Notes", type: "textarea", full: true }],
    statusKey: "lifecycle_stage", tabs: [{ label: "All Leads", value: "all" }, { label: "New Inquiry", value: "New Inquiry" }, { label: "Follow-Ups Today", value: "Follow-Up Due" }, { label: "Won", value: "Won" }, { label: "Future Opportunity", value: "Future Opportunity" }, { label: "Dormant", value: "Dormant" }, { label: "Lost", value: "Lost" }], defaults: { status: "new", lifecycle_stage: "New Inquiry", lead_temperature: "New", lead_source: "Manual" },
  },
  companies: {
    eyebrow: "B2B company database", title: "Companies", subtitle: "Maintain actual prospect, importer, distributor and client company records.", table: "b2b_companies", primaryAction: "Add Company", migrationRequired: true,
    columns: [{ key: "name", label: "Company" }, { key: "country", label: "Country" }, { key: "company_type", label: "Company Type" }, { key: "industry", label: "Industry" }, { key: "website", label: "Website" }, { key: "primary_contact_name", label: "Primary Contact" }, { key: "tier", label: "Tier" }, { key: "relationship_status", label: "Status" }, { key: "next_follow_up_at", label: "Next Follow-Up" }],
    fields: [{ key: "name", label: "Company Name", required: true, full: true }, { key: "country", label: "Country" }, { key: "company_type", label: "Company Type", type: "select", options: ["Prospect", "Warm Prospect", "Active Client", "Repeat Client", "Distributor", "Importer", "Wholesaler", "Private Label Brand", "Manufacturer", "Retail Chain", "Dormant"] }, { key: "industry", label: "Industry" }, { key: "website", label: "Website", type: "url" }, { key: "primary_contact_name", label: "Primary Contact" }, { key: "primary_contact_email", label: "Contact Email", type: "email" }, { key: "products_of_interest", label: "Products of Interest", type: "array", full: true }, { key: "estimated_annual_volume", label: "Estimated Annual Volume" }, { key: "tier", label: "Tier", type: "select", options: ["Strategic", "Tier A", "Tier B", "Tier C", "New"] }, { key: "relationship_status", label: "Relationship Status", type: "select", options: ["Prospect", "Warm Prospect", "Active Client", "Repeat Client", "Dormant", "Lost"] }, { key: "preferred_buyer", label: "Preferred Buyer", type: "checkbox" }, { key: "repeat_client", label: "Repeat Client", type: "checkbox" }, { key: "next_follow_up_at", label: "Next Follow-Up", type: "datetime" }, { key: "notes", label: "Notes", type: "textarea", full: true }], statusKey: "relationship_status",
  },
  contacts: {
    eyebrow: "Buyer contacts", title: "Contacts", subtitle: "Store every real buyer, inquiry contact and client representative.", table: "b2b_contacts", primaryAction: "Add Contact", migrationRequired: true,
    columns: [{ key: "name", label: "Name" }, { key: "job_title", label: "Job Title" }, { key: "email", label: "Email" }, { key: "phone_whatsapp", label: "Phone / WhatsApp" }, { key: "country", label: "Country" }, { key: "lifecycle", label: "Lifecycle" }, { key: "source", label: "Source" }, { key: "platform", label: "Platform" }, { key: "product_interest", label: "Product Interest" }, { key: "next_follow_up_at", label: "Next Follow-Up" }],
    fields: [{ key: "name", label: "Name", required: true, full: true }, { key: "job_title", label: "Job Title" }, { key: "email", label: "Email", type: "email" }, { key: "phone_whatsapp", label: "Phone / WhatsApp" }, { key: "country", label: "Country" }, { key: "lifecycle", label: "Lifecycle", type: "select", options: ["Subscriber", "New Contact", "Inquiry", "Qualified Lead", "Warm Lead", "Opportunity", "Client Contact", "Inactive", "Lost"] }, { key: "source", label: "Source", type: "select", options: ["Organic Search", "Outbound Prospecting", "Website Inquiry", "Referral", "Trade Fair", "Catalogue Download"] }, { key: "platform", label: "Contact Platform", type: "select", options: ["LinkedIn", "Facebook", "Instagram", "WhatsApp", "Email", "Phone", "Trade Fair", "Website", "Other"] }, { key: "product_interest", label: "Product Interest" }, { key: "last_contact_at", label: "Last Contact", type: "datetime" }, { key: "next_follow_up_at", label: "Next Follow-Up", type: "datetime" }, { key: "notes", label: "Notes", type: "textarea", full: true }], statusKey: "lifecycle",
  },
  clients: {
    eyebrow: "Client management", title: "Clients", subtitle: "Manage actual B2B client accounts without retail commerce metrics.", table: "customer_accounts", primaryAction: "Add Client",
    columns: [{ key: "company_name", label: "Client / Company" }, { key: "country", label: "Country" }, { key: "industry", label: "Industry" }, { key: "segment", label: "Segment" }, { key: "tier", label: "Tier" }, { key: "contact_name", label: "Primary Contact" }, { key: "products", label: "Products" }, { key: "last_quotation", label: "Last Quotation" }, { key: "last_shipment", label: "Last Shipment" }, { key: "status", label: "Status" }],
    fields: [{ key: "company_name", label: "Client / Company", required: true, full: true }, { key: "contact_name", label: "Primary Contact" }, { key: "email", label: "Email", type: "email", required: true }, { key: "phone", label: "Phone / WhatsApp" }, { key: "country", label: "Country" }, { key: "industry", label: "Industry" }, { key: "website", label: "Website", type: "url" }, { key: "segment", label: "Segment", type: "select", options: ["New Client", "Active Client", "Repeat Client", "Strategic Client", "Distributor", "Private Label Client", "Dormant Client"] }, { key: "tier", label: "Tier", type: "select", options: ["Strategic", "Tier A", "Tier B", "Tier C", "New"] }, { key: "products", label: "Products", type: "array", full: true }, { key: "last_quotation", label: "Last Quotation" }, { key: "last_shipment", label: "Last Shipment" }, { key: "last_contact_at", label: "Last Contact", type: "datetime" }, { key: "repeat_client", label: "Repeat Client", type: "checkbox" }, { key: "preferred_buyer", label: "Preferred Buyer", type: "checkbox" }, { key: "status", label: "Status", type: "select", options: ["active", "dormant", "closed"] }, { key: "notes", label: "Notes", type: "textarea", full: true }], statusKey: "status",
  },
  "export-documents": {
    eyebrow: "Shipment documentation", title: "Export Document Center", subtitle: "Manage actual commercial invoices, packing lists, certificates and shipment documents.", table: "business_documents", primaryAction: "Create Export Document",
    filter: { key: "document_type", op: "neq", value: "quotation" }, columns: [{ key: "document_number", label: "Document Number" }, { key: "document_type", label: "Type" }, { key: "buyer_company", label: "Client" }, { key: "buyer_country", label: "Country" }, { key: "issue_date", label: "Issue Date" }, { key: "incoterm", label: "Incoterm" }, { key: "status", label: "Status" }, { key: "updated_at", label: "Updated" }],
    fields: [{ key: "document_type", label: "Document Type", type: "select", options: ["proforma_invoice", "commercial_invoice", "packing_list", "sales_contract", "order_confirmation", "sample_invoice", "coa_cover_document"] }, { key: "buyer_company", label: "Client Company", required: true }, { key: "buyer_name", label: "Contact" }, { key: "buyer_email", label: "Email", type: "email" }, { key: "buyer_country", label: "Destination Country" }, { key: "currency", label: "Currency", type: "select", options: ["USD", "EUR", "GBP", "AED", "SAR", "CAD"] }, { key: "issue_date", label: "Issue Date", type: "date" }, { key: "valid_until", label: "Validity", type: "date" }, { key: "incoterm", label: "Incoterm", type: "select", options: ["EXW", "FOB", "CFR", "CIF", "DAP", "DDP"] }, { key: "port_of_loading", label: "Port of Loading" }, { key: "port_of_discharge", label: "Port of Discharge" }, { key: "payment_terms", label: "Payment Terms" }, { key: "delivery_terms", label: "Delivery Lead Time" }, { key: "status", label: "Status", type: "select", options: ["draft", "internal_review", "approved_to_send", "sent", "delivered", "viewed", "revision_requested", "revised", "accepted", "signed", "rejected", "expired"] }, { key: "notes", label: "Notes", type: "textarea", full: true }], statusKey: "status", defaults: { document_type: "commercial_invoice", currency: "USD", status: "draft" },
  },
  campaigns: {
    eyebrow: "Integrated marketing", title: "Campaigns", subtitle: "Manage real export-market, private-label and distributor campaigns.", table: "marketing_campaigns", primaryAction: "Create Campaign",
    columns: [{ key: "name", label: "Campaign" }, { key: "campaign_type", label: "Type" }, { key: "objective", label: "Objective" }, { key: "target_countries", label: "Countries" }, { key: "channels", label: "Channels" }, { key: "leads_generated", label: "Leads Generated" }, { key: "scheduled_at", label: "Schedule" }, { key: "status", label: "Status" }],
    fields: [{ key: "name", label: "Campaign Name", required: true, full: true }, { key: "campaign_type", label: "Campaign Type", type: "select", options: ["Export Market Campaign", "New Product Launch", "Private Label Campaign", "Trade Show Campaign", "Distributor Outreach", "Certification Announcement", "Seasonal Content Campaign", "email", "newsletter"] }, { key: "objective", label: "Objective", type: "textarea", full: true }, { key: "target_countries", label: "Target Countries", type: "array" }, { key: "target_audience", label: "Target Audience" }, { key: "channels", label: "Channels", type: "array" }, { key: "landing_page", label: "Landing Page", type: "url" }, { key: "subject", label: "Subject" }, { key: "content", label: "Content", type: "textarea", full: true }, { key: "scheduled_at", label: "Schedule", type: "datetime" }, { key: "status", label: "Status", type: "select", options: ["draft", "review", "approved", "scheduled", "active", "completed", "paused", "archived"] }], statusKey: "status",
  },
  "email-marketing": {
    eyebrow: "B2B email marketing", title: "Email Marketing", subtitle: "Create real B2B email campaigns and track their lead-generation status.", table: "marketing_campaigns", primaryAction: "Create Email Campaign", filter: { key: "campaign_type", op: "eq", value: "email" },
    columns: [{ key: "name", label: "Campaign" }, { key: "subject", label: "Subject" }, { key: "target_audience", label: "Audience" }, { key: "scheduled_at", label: "Schedule" }, { key: "leads_generated", label: "Leads Generated" }, { key: "status", label: "Status" }],
    fields: [{ key: "name", label: "Campaign Name", required: true, full: true }, { key: "subject", label: "Subject", required: true, full: true }, { key: "target_audience", label: "Recipient Segment" }, { key: "content", label: "Email Body", type: "textarea", full: true }, { key: "landing_page", label: "CTA Link", type: "url" }, { key: "scheduled_at", label: "Schedule", type: "datetime" }, { key: "status", label: "Status", type: "select", options: approvalStatuses.map(value => value.toLowerCase().replaceAll(" ", "_")) }], statusKey: "status", defaults: { campaign_type: "email", status: "draft" },
  },
  newsletter: {
    eyebrow: "Website subscribers", title: "Newsletter Subscribers", subtitle: "View real email addresses submitted through the website subscription form.", table: "newsletter_subscribers", primaryAction: "Subscriber", readOnly: true,
    columns: [{ key: "email", label: "Email" }, { key: "source", label: "Source" }, { key: "language", label: "Language" }, { key: "status", label: "Status" }, { key: "created_at", label: "Subscribed" }],
    fields: [], statusKey: "status",
  },
  "marketing-overview": {
    eyebrow: "Lead-generation marketing", title: "Marketing Overview", subtitle: "Live campaign records and B2B lead-generation status without revenue metrics.", table: "marketing_campaigns", primaryAction: "Create Campaign",
    columns: [{ key: "name", label: "Campaign" }, { key: "campaign_type", label: "Type" }, { key: "target_countries", label: "Target Countries" }, { key: "channels", label: "Channels" }, { key: "leads_generated", label: "Leads Generated" }, { key: "status", label: "Status" }, { key: "updated_at", label: "Updated" }],
    fields: [{ key: "name", label: "Campaign Name", required: true, full: true }, { key: "campaign_type", label: "Campaign Type" }, { key: "objective", label: "Objective", type: "textarea", full: true }, { key: "target_countries", label: "Target Countries", type: "array" }, { key: "channels", label: "Channels", type: "array" }, { key: "landing_page", label: "Landing Page", type: "url" }, { key: "status", label: "Status", type: "select", options: ["draft", "review", "approved", "scheduled", "active", "completed", "paused"] }], statusKey: "status",
  },
  "geo-manager": {
    eyebrow: "Generative Engine Optimization", title: "GEO Manager", subtitle: "Store real page audits, answer readiness and AI-search optimization actions.", table: "geo_audits", primaryAction: "Create GEO Audit", migrationRequired: true,
    columns: [{ key: "page_path", label: "Page" }, { key: "page_title", label: "Title" }, { key: "ai_visibility_score", label: "AI Visibility" }, { key: "answer_readiness_score", label: "Answer Readiness" }, { key: "entity_consistency_score", label: "Entity Consistency" }, { key: "citation_opportunities", label: "Citations" }, { key: "status", label: "Status" }, { key: "last_audited_at", label: "Last Audit" }],
    fields: [{ key: "page_path", label: "Page Path", required: true }, { key: "page_title", label: "Page Title" }, { key: "ai_visibility_score", label: "AI Visibility Score", type: "number" }, { key: "answer_readiness_score", label: "Answer Readiness Score", type: "number" }, { key: "entity_consistency_score", label: "Entity Consistency Score", type: "number" }, { key: "citation_opportunities", label: "Citation Opportunities", type: "number" }, { key: "recommendations", label: "Recommendations", type: "json", full: true }, { key: "llms_txt_excerpt", label: "llms.txt Preview", type: "textarea", full: true }, { key: "last_audited_at", label: "Last Audited", type: "datetime" }, { key: "status", label: "Status", type: "select", options: ["Needs Review", "In Progress", "Optimized", "Monitor"] }], statusKey: "status",
  },
  competitors: {
    eyebrow: "Market intelligence", title: "Competitor Intelligence", subtitle: "Track actual B2B positioning, content, keyword and backlink changes.", table: "competitor_profiles", primaryAction: "Add Competitor", migrationRequired: true,
    columns: [{ key: "domain", label: "Domain" }, { key: "company_name", label: "Company" }, { key: "country", label: "Country" }, { key: "market_focus", label: "Market Focus" }, { key: "top_keywords", label: "Keyword Themes" }, { key: "content_gaps", label: "Content Gaps" }, { key: "status", label: "Status" }, { key: "last_checked_at", label: "Last Checked" }],
    fields: [{ key: "domain", label: "Domain", required: true, type: "url", full: true }, { key: "company_name", label: "Company Name" }, { key: "country", label: "Country" }, { key: "market_focus", label: "Market Focus", type: "textarea", full: true }, { key: "top_keywords", label: "Verified Keyword Themes", type: "json", full: true }, { key: "content_gaps", label: "Content Gaps", type: "json", full: true }, { key: "backlink_gaps", label: "Backlink Gaps", type: "json", full: true }, { key: "last_checked_at", label: "Last Checked", type: "datetime" }, { key: "status", label: "Status", type: "select", options: ["Active", "Paused", "Archived"] }, { key: "notes", label: "Evidence Notes", type: "textarea", full: true }], statusKey: "status",
  },
  reports: {
    eyebrow: "Business intelligence", title: "Reports", subtitle: "Save real report definitions and export current live CMS data.", table: "saved_reports", primaryAction: "Create Report", migrationRequired: true,
    columns: [{ key: "name", label: "Report" }, { key: "report_type", label: "Type" }, { key: "date_from", label: "From" }, { key: "date_to", label: "To" }, { key: "country_filter", label: "Country" }, { key: "status", label: "Status" }, { key: "generated_at", label: "Generated" }],
    fields: [{ key: "name", label: "Report Name", required: true, full: true }, { key: "report_type", label: "Report Type", type: "select", options: ["Executive Report", "Website Traffic Report", "Lead Report", "Lead Source Report", "Country Inquiry Report", "Quotation Report", "Quotation Follow-Up Report", "Client Activity Report", "Sample Request Report", "Shipment Report", "Content Performance Report", "SEO Report", "GEO Report", "Social Media Report", "Email Marketing Report", "Certification Expiry Report"] }, { key: "date_from", label: "Date From", type: "date" }, { key: "date_to", label: "Date To", type: "date" }, { key: "country_filter", label: "Country Filter" }, { key: "filters", label: "Advanced Filters", type: "json", full: true }, { key: "status", label: "Status", type: "select", options: ["Ready", "Generating", "Archived"] }], statusKey: "status",
  },
  "activity-logs": {
    eyebrow: "Security and accountability", title: "Activity Logs", subtitle: "Read actual lead, quotation, shipment and CMS actions generated by the database.", table: "b2b_activities", primaryAction: "Activity", migrationRequired: true, readOnly: true,
    columns: [{ key: "created_at", label: "Date & Time" }, { key: "actor_email", label: "User" }, { key: "activity_type", label: "Action" }, { key: "module", label: "Module" }, { key: "title", label: "Record" }, { key: "description", label: "Change Summary" }, { key: "country", label: "Country" }], fields: [],
  },
  "ai-agents": {
    eyebrow: "Human-approved AI operations", title: "AI Agents", subtitle: "Configure actual agent records. All agents remain subject to manual approval.", table: "ai_agents", primaryAction: "Create AI Agent", migrationRequired: true,
    columns: [{ key: "name", label: "Agent" }, { key: "purpose", label: "Purpose" }, { key: "status", label: "Status" }, { key: "last_run_at", label: "Last Run" }, { key: "tasks_completed", label: "Tasks Completed" }, { key: "pending_approvals", label: "Pending Approvals" }, { key: "last_activity", label: "Last Activity" }],
    fields: [{ key: "name", label: "Agent Name", required: true, full: true }, { key: "purpose", label: "Purpose", type: "textarea", full: true }, { key: "status", label: "Status", type: "select", options: ["Active", "Paused", "Needs Attention"] }, { key: "settings", label: "Settings", type: "json", full: true }, { key: "last_run_at", label: "Last Run", type: "datetime" }, { key: "tasks_completed", label: "Tasks Completed", type: "number" }, { key: "pending_approvals", label: "Pending Approvals", type: "number" }, { key: "last_activity", label: "Last Activity", type: "textarea", full: true }], statusKey: "status",
  },
};

function normalize(value: unknown) { return String(value ?? "").trim().toLowerCase().replaceAll("_", " "); }
function titleCase(value: unknown) { return String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase()); }
function formatValue(value: any) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString();
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00`).toLocaleDateString();
  return String(value);
}
function toneForStatus(value: unknown) {
  const status = normalize(value);
  if (["active", "approved", "published", "valid", "won", "complete", "completed", "sent", "link live", "optimized", "live"].some(word => status.includes(word))) return "green";
  if (["review", "pending", "follow", "scheduled", "preparing", "in progress", "revision", "expiring", "waiting"].some(word => status.includes(word))) return "amber";
  if (["rejected", "expired", "lost", "failed", "closed", "cancelled", "needs attention"].some(word => status.includes(word))) return "pink";
  return "blue";
}
function dateWithin30Days(value: unknown) { const date = new Date(String(value || "")); return !Number.isNaN(date.getTime()) && Date.now() - date.getTime() <= 30 * 86400000; }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function csvCell(value: any) { const text = formatValue(value).replaceAll('"', '""'); return `"${text}"`; }
function cleanReviewHtml(value: unknown) {
  const raw = stripResearchLinks(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "");
  if (/<(?:h2|h3|p|ul|ol|li|strong)\b/i.test(raw)) return raw.replace(/<(?!\/?(?:h2|h3|p|ul|ol|li|strong)\b)[^>]+>/gi, "").replace(/<(h2|h3|p|ul|ol|li|strong)\b[^>]*>/gi, "<$1>");
  return raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    if (/^[-*•]\s+/.test(line)) return `<li>${line.replace(/^[-*•]\s+/, "")}</li>`;
    if (line.endsWith("?") && line.length < 150) return `<h3>${line}</h3>`;
    if (line.length < 90 && /^(faq|conclusion|how |what |why |packaging|quality|documentation|shipping|private label|supplier|applications)/i.test(line)) return `<h2>${line}</h2>`;
    return `<p>${line}</p>`;
  }).join("");
}

export default function B2BModulePage({ moduleKey }: { moduleKey: string }) {
  const config = configs[moduleKey] || configs.companies;
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState(config.tabs?.[0]?.value || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [reviewing, setReviewing] = useState<Row | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [fileField, setFileField] = useState<string>("");
  const pageSize = 12;

  useEffect(() => { void load(); }, [moduleKey]);
  useEffect(() => {
    const action = searchParams.get("action");
    if ((action === "create" || action === "upload") && !config.readOnly) openCreate();
    if ((action === "generate" || action === "research") && ["faq-intelligence", "outreach", "competitors"].includes(moduleKey)) void runAutomation();
  }, [searchParams, moduleKey]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2600); return () => window.clearTimeout(timer); }, [toast]);

  async function load() {
    setLoading(true); setError("");
    let request: any = supabase.from(config.table).select("*");
    if (config.filter) request = config.filter.op === "eq" ? request.eq(config.filter.key, config.filter.value) : request.neq(config.filter.key, config.filter.value);
    const { data, error: loadError } = await request.order(config.orderKey || "created_at", { ascending: false }).limit(1000);
    if (loadError) { setRows([]); setError(loadError.message); }
    else setRows(data || []);
    setLoading(false);
  }

  function defaultForm() {
    const values = Object.fromEntries(config.fields.map(field => [field.key, field.defaultValue ?? config.defaults?.[field.key] ?? (field.type === "checkbox" ? false : field.type === "json" ? "{}" : "")]).concat(Object.entries(config.defaults || {})));
    if (moduleKey === "contacts") {
      const followUp = new Date(); followUp.setDate(followUp.getDate() + 7); followUp.setHours(10, 0, 0, 0);
      values.next_follow_up_at = followUp.toISOString().slice(0, 16);
      values.lifecycle = values.lifecycle || "New Contact";
    }
    if (moduleKey === "leads") values.lifecycle_stage = values.lifecycle_stage || "New Inquiry";
    return values;
  }
  function openCreate() { setEditing(null); setForm(defaultForm()); setModalOpen(true); }
  function openBlogReview(row: Row) {
    setReviewing(row); setError("");
    if (!Number(row.seo_score || 0) || !Number(row.geo_score || 0) || !row.primary_keyword) void recalculateBlogQuality(row, true);
  }
  function openEdit(row: Row) {
    setEditing(row);
    const next: Record<string, any> = {};
    config.fields.forEach(field => {
      const value = row[field.key];
      if (field.type === "json") next[field.key] = JSON.stringify(value ?? field.defaultValue ?? {}, null, 2);
      else if (field.type === "array") next[field.key] = Array.isArray(value) ? value.join(", ") : String(value || "");
      else if (field.type === "datetime" && value) next[field.key] = new Date(value).toISOString().slice(0, 16);
      else next[field.key] = value ?? (field.type === "checkbox" ? false : "");
    });
    setForm(next); setModalOpen(true);
  }

  function preparePayload() {
    const payload: Record<string, any> = { ...(config.defaults || {}) };
    config.fields.forEach(field => {
      if (field.readOnly) return;
      let value = form[field.key];
      if (field.type === "number") value = value === "" || value === null ? null : Number(value);
      if (field.type === "array") value = String(value || "").split(",").map(item => item.trim()).filter(Boolean);
      if (field.type === "json") { try { value = typeof value === "string" ? JSON.parse(value || "{}") : value; } catch { throw new Error(`${field.label} must contain valid JSON.`); } }
      if (field.type === "datetime") value = value ? new Date(value).toISOString() : null;
      if (field.type === "date") value = value || null;
      if (field.type === "checkbox") value = Boolean(value);
      if (["text", "textarea", "email", "url", "select", "file"].includes(field.type || "text") && typeof value === "string") value = value.trim();
      payload[field.key] = value === "" ? null : value;
    });
    if (moduleKey === "blog-center") {
      payload.content_type = payload.content_type || editing?.content_type || "blog";
      if (!payload.slug && payload.title) payload.slug = slugify(payload.title);
      payload.title = stripResearchLinks(payload.title);
      payload.excerpt = stripResearchLinks(payload.excerpt);
      payload.content = normalizeGeneratedArticle(payload.content);
      payload.seo_title = stripResearchLinks(payload.seo_title);
      payload.seo_description = stripResearchLinks(payload.seo_description);
    }
    if (moduleKey === "email-marketing") payload.campaign_type = "email";
    if (moduleKey === "newsletter") payload.campaign_type = "newsletter";
    return payload;
  }

  async function saveRecord() {
    for (const field of config.fields) if (field.required && !String(form[field.key] ?? "").trim()) { setError(`${field.label} is required.`); return; }
    setSaving(true); setError("");
    try {
      const payload = preparePayload();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!editing && userId) {
        if (Object.prototype.hasOwnProperty.call(payload, "created_by") || ["b2b_companies", "b2b_contacts", "certifications", "website_forms", "sample_requests", "outreach_opportunities", "faq_research_questions", "geo_audits", "ai_agents", "saved_reports", "competitor_profiles"].includes(config.table)) payload.created_by = userId;
      }
      const request = editing ? supabase.from(config.table).update(payload).eq("id", editing.id) : supabase.from(config.table).insert(payload);
      const { data, error: saveError } = await request.select("*").single();
      if (saveError) throw saveError;
      await logActivity(editing ? "updated" : "created", data);
      setModalOpen(false); setToast(`${config.title} record ${editing ? "updated" : "created"}`); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save this record."); }
    finally { setSaving(false); }
  }

  async function recalculateBlogQuality(row: Row, quiet = false) {
    if (moduleKey !== "blog-center") return;
    try {
      const keywords = normalizeKeywordList(row.primary_keyword, row.keywords, String(row.title || ""));
      const primaryKeyword = String(row.primary_keyword || keywords[0] || "");
      const seoScore = calculateSeoScore({
        title: String(row.title || ""), slug: String(row.slug || ""), excerpt: String(row.excerpt || ""), content: String(row.content || ""),
        seoTitle: String(row.seo_title || row.title || ""), seoDescription: String(row.seo_description || row.excerpt || ""),
        primaryKeyword, secondaryKeywords: keywords, featuredImage: String(row.featured_image || ""),
      });
      const geoScore = calculateGeoScore({ title: String(row.title || ""), excerpt: String(row.excerpt || ""), content: String(row.content || ""), primaryKeyword, targetCountry: String(row.target_country || "Global") });
      const patch = { primary_keyword: primaryKeyword || null, keywords, seo_score: seoScore, geo_score: geoScore, updated_at: new Date().toISOString() };
      const { data, error: qualityError } = await supabase.from(config.table).update(patch).eq("id", row.id).select("*").single();
      if (qualityError) throw qualityError;
      setRows(current => current.map(item => String(item.id) === String(row.id) ? data : item));
      setReviewing(current => current && String(current.id) === String(row.id) ? data : current);
      if (!quiet) setToast("SEO, GEO and keyword scores recalculated from the current article");
    } catch (qualityError) { if (!quiet) setError(qualityError instanceof Error ? qualityError.message : "Score calculation failed."); }
  }

  async function updateInlineField(row: Row, key: string, value: string) {
    setSaving(true); setError("");
    try {
      const patch: Record<string, any> = { [key]: value, updated_at: new Date().toISOString() };
      if (moduleKey === "leads" && key === "lifecycle_stage") {
        if (normalize(value) === "won") patch.won_at = new Date().toISOString();
        if (normalize(value) === "lost") patch.lost_at = new Date().toISOString();
      }
      const { data, error: updateError } = await supabase.from(config.table).update(patch).eq("id", row.id).select("*").single();
      if (updateError) throw updateError;
      await logActivity("status updated", data);
      setRows(current => current.map(item => String(item.id) === String(row.id) ? data : item));
      setToast(`${config.title} status updated`);
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : "Unable to update this record."); }
    finally { setSaving(false); }
  }

  async function runAutomation() {
    const endpoint = moduleKey === "blog-center" ? "/api/blog/daily-draft" : moduleKey === "faq-intelligence" ? "/api/faq/daily-research" : moduleKey === "outreach" ? "/api/outreach/daily-research" : moduleKey === "competitors" ? "/api/competitors/daily-research" : "";
    if (!endpoint || automationRunning) return;
    setAutomationRunning(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Research could not be completed.");
      setToast(payload.skipped ? payload.reason || "Today's research is already available" : moduleKey === "blog-center" ? "Fresh blog and SEO article drafts are ready for review" : moduleKey === "faq-intelligence" ? "Fresh buyer questions and answers are ready for review" : "Fresh outreach opportunities are ready for review");
      await load();
    } catch (automationError) { setError(automationError instanceof Error ? automationError.message : "Research failed."); }
    finally { setAutomationRunning(false); }
  }

  async function changeWorkflowStatus(row: Row, nextStatus: string) {
    setSaving(true); setError("");
    try {
      if (moduleKey === "faq-intelligence" && nextStatus === "Published") {
        const faqPayload = { question: row.question, answer: row.ai_answer || "", category: row.recommended_category || "Buyer Questions", status: "published", source: row.source || null, target_country: row.target_country || null, related_keyword: row.related_keyword || null, demand_score: row.demand_score || null, schema_json: row.schema_preview || {}, internal_links: row.internal_links || [], reference_notes: row.reference_notes || null, updated_at: new Date().toISOString() };
        const existing = await supabase.from("cms_faqs").select("id").eq("question", row.question).limit(1).maybeSingle();
        const published = existing.data?.id ? await supabase.from("cms_faqs").update(faqPayload).eq("id", existing.data.id) : await supabase.from("cms_faqs").insert(faqPayload);
        if (published.error) throw published.error;
      }
      const payload: Record<string, any> = { [config.statusKey || "status"]: nextStatus, updated_at: new Date().toISOString() };
      if (moduleKey === "blog-center" && nextStatus.toLowerCase() === "published") payload.published_at = new Date().toISOString();
      const { error: statusError } = await supabase.from(config.table).update(payload).eq("id", row.id);
      if (statusError) throw statusError;
      await logActivity(`status changed to ${nextStatus}`, row);
      setToast(`${config.title} moved to ${nextStatus}`);
      if (reviewing && String(reviewing.id) === String(row.id)) setReviewing({ ...reviewing, ...payload });
      await load();
    } catch (statusError) { setError(statusError instanceof Error ? statusError.message : "Status update failed."); }
    finally { setSaving(false); }
  }

  async function deleteRecord() {
    if (!deleteTarget) return;
    setSaving(true); setError("");
    const { error: deleteError } = await supabase.from(config.table).delete().eq("id", deleteTarget.id);
    if (deleteError) setError(deleteError.message);
    else { await logActivity("deleted", deleteTarget); setToast(`${config.title} record deleted`); setDeleteTarget(null); await load(); }
    setSaving(false);
  }

  async function logActivity(action: string, row: Row) {
    const { data } = await supabase.auth.getSession();
    try {
      await supabase.from("b2b_activities").insert({ activity_type: action, module: config.title, record_id: String(row.id || ""), title: `${config.title} record ${action}`, description: formatValue(row[config.columns[0]?.key]), actor_id: data.session?.user.id || null, actor_email: data.session?.user.email || null, metadata: { table: config.table } });
    } catch {
      // Activity logging must never block the primary CMS action.
    }
  }

  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file || !fileField) return;
    setSaving(true); setError("");
    const path = `${moduleKey}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
    const { error: uploadError } = await supabase.storage.from("cms-media").upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (uploadError) setError(uploadError.message);
    else { const url = supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl; setForm(previous => ({ ...previous, [fileField]: url })); setToast("File uploaded to the CMS media bucket"); }
    setSaving(false); event.target.value = "";
  }

  function exportCsv() {
    const header = config.columns.map(column => csvCell(column.label)).join(",");
    const body = filtered.map(row => config.columns.map(column => csvCell(row[column.key])).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${moduleKey}-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url); setToast("Live data exported");
  }

  const statuses = useMemo(() => config.statusKey ? [...new Set(rows.map(row => formatValue(row[config.statusKey!])).filter(value => value !== "—"))] : [], [rows, config.statusKey]);
  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return rows.filter(row => {
      const textMatch = !needle || config.columns.some(column => formatValue(row[column.key]).toLowerCase().includes(needle));
      const rowStatus = normalize(row[config.statusKey || "status"]);
      const dueToday = moduleKey === "leads" && activeTab === "Follow-Up Due" && row.next_follow_up_at && new Date(row.next_follow_up_at).getTime() <= new Date().setHours(23, 59, 59, 999);
      const tabMatch = activeTab === "all" || rowStatus === normalize(activeTab) || Boolean(dueToday);
      const statusMatch = statusFilter === "all" || rowStatus === normalize(statusFilter);
      return textMatch && tabMatch && statusMatch;
    });
  }, [rows, query, activeTab, statusFilter, config]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [query, activeTab, statusFilter]);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysBlogRows = moduleKey === "blog-center" ? rows.filter(row => String(row.created_at || row.updated_at || "").slice(0, 10) === todayKey).slice(0, 2) : [];

  const recentCount = rows.filter(row => dateWithin30Days(row.created_at)).length;
  const attentionCount = rows.filter(row => ["draft", "needs review", "under review", "pending", "follow up", "expiring soon", "needs attention", "new suggestion"].some(status => normalize(row[config.statusKey || "status"]).includes(status))).length;
  const completedCount = rows.filter(row => ["approved", "published", "valid", "active", "completed", "won", "sent", "link live", "optimized", "live"].some(status => normalize(row[config.statusKey || "status"]).includes(status))).length;
  const moduleSummary = moduleKey === "blog-center" ? [
    ["Drafts", rows.filter(row => normalize(row.status) === "draft").length, "Waiting for review", <FileUp key="a"/>],
    ["In Review", rows.filter(row => normalize(row.status) === "review").length, "Human review queue", <AlertTriangle key="b"/>],
    ["Approved", rows.filter(row => normalize(row.status) === "approved").length, "Ready to publish", <CheckCircle2 key="c"/>],
    ["Published", rows.filter(row => normalize(row.status) === "published").length, "Live website posts", <Globe2 key="d"/>],
  ] : moduleKey === "faq-intelligence" ? [
    ["New Questions", rows.filter(row => ["new suggestion", "draft"].includes(normalize(row.status))).length, "Research queue", <Sparkles key="a"/>],
    ["In Review", rows.filter(row => normalize(row.status) === "in review").length, "Human review queue", <AlertTriangle key="b"/>],
    ["Approved", rows.filter(row => normalize(row.status) === "approved").length, "Ready to publish", <CheckCircle2 key="c"/>],
    ["Published", rows.filter(row => normalize(row.status) === "published").length, "Live website FAQs", <Globe2 key="d"/>],
  ] : moduleKey === "outreach" ? [
    ["Identified", rows.filter(row => normalize(row.status) === "identified").length, "Verify and qualify", <Search key="a"/>],
    ["Contacted", rows.filter(row => normalize(row.status) === "contacted").length, "Outreach sent", <Send key="b"/>],
    ["Follow-Up Due", rows.filter(row => normalize(row.status).includes("follow") || (row.follow_up_date && new Date(row.follow_up_date) <= new Date())).length, "Action required", <AlertTriangle key="c"/>],
    ["Links Live", rows.filter(row => normalize(row.status) === "link live").length, "Verified placements", <CheckCircle2 key="d"/>],
  ] : null;

  function renderCell(row: Row, column: Column, index: number) {
    const isStatus = column.key === (config.statusKey || "status");
    if (isStatus && moduleKey === "leads") return <select className="os-inline-status" value={row[column.key] || "New Inquiry"} disabled={saving} onChange={event => void updateInlineField(row, column.key, event.target.value)}>{leadStages.map(stage => <option key={stage}>{stage}</option>)}</select>;
    if (isStatus && moduleKey === "contacts") return <select className="os-inline-status" value={row[column.key] || "New Contact"} disabled={saving} onChange={event => void updateInlineField(row, column.key, event.target.value)}>{["Subscriber", "New Contact", "Inquiry", "Qualified Lead", "Warm Lead", "Opportunity", "Client Contact", "Inactive", "Lost"].map(stage => <option key={stage}>{stage}</option>)}</select>;
    if (isStatus) return <span className={`os-badge ${toneForStatus(row[column.key])}`}>{titleCase(row[column.key] || "Not Set")}</span>;
    if (column.key === "featured_image") return row.featured_image ? <img className="blog-table-thumbnail" src={String(row.featured_image)} alt="" /> : <span className="blog-image-pending">Image pending</span>;
    if (column.key === "next_follow_up_at") {
      const due = row[column.key] && new Date(row[column.key]).getTime() <= Date.now();
      return <span className={due ? "os-followup-due" : ""}>{formatValue(row[column.key])}</span>;
    }
    if (index === 0) return <div className="os-record-title"><span className="os-record-icon">{formatValue(row[column.key]).slice(0, 2).toUpperCase()}</span><div><strong>{formatValue(row[column.key])}</strong>{column.secondaryKey && <span>{formatValue(row[column.secondaryKey])}</span>}</div></div>;
    return <span title={formatValue(row[column.key])}>{formatValue(row[column.key]).slice(0, 120)}</span>;
  }

  return <div className="os-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">{config.eyebrow}</div><h1 className="os-page-title">{config.title}</h1><p className="os-page-subtitle">{moduleKey === "blog-center" ? "Review, edit, schedule and publish the blog drafts created from your manual Content Studio topic queue." : config.subtitle}</p></div><div className="os-page-actions">{moduleKey === "blog-center" && <a className="os-btn primary" href="/admin/content-studio"><Sparkles/>Open AI Content Studio</a>}{["faq-intelligence", "outreach", "competitors"].includes(moduleKey) && <button className="os-btn primary" onClick={() => void runAutomation()} disabled={automationRunning}><Sparkles className={automationRunning ? "animate-spin" : ""}/>{automationRunning ? "Researching…" : moduleKey === "faq-intelligence" ? "Refresh Buyer Questions" : moduleKey === "competitors" ? "Research Competitors" : "Research Opportunities"}</button>}<button className="os-btn soft" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Refresh</button><button className="os-btn soft" onClick={exportCsv} disabled={!rows.length}><Download />Export</button>{!config.readOnly && <button className="os-btn primary" onClick={openCreate}><Plus />{config.primaryAction}</button>}</div></header>

    {config.explanation && <section className="os-card"><div className="os-card-body"><strong>How this module works</strong><p className="os-page-subtitle" style={{ marginTop: 6 }}>{config.explanation}</p></div></section>}
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span className="os-list-icon" style={{ color: "#dc2626" }}><AlertTriangle /></span><div><strong>Live data error</strong><p className="os-page-subtitle" style={{ marginTop: 5 }}>{error}</p>{config.migrationRequired && <p className="os-page-subtitle" style={{ marginTop: 5 }}>Run <b>supabase/THE-SALT-ORIGIN-LIVE-CMS.sql</b> once in Supabase SQL Editor. Only connected live records are displayed.</p>}</div></div></section>}

    {["blog-center", "faq-intelligence", "outreach", "certifications", "activity-logs"].includes(moduleKey) && <section className="os-summary-four">{moduleKey === "activity-logs" ? <>
      <SummaryCard label="Changes Today" value={rows.filter(row => new Date(row.created_at || 0).toDateString() === new Date().toDateString()).length} note="Live audit events" icon={<FileUp/>}/><SummaryCard label="Created" value={rows.filter(row => normalize(row.activity_type).includes("created")).length} note="Create actions" icon={<Plus/>}/><SummaryCard label="Updated" value={rows.filter(row => normalize(row.activity_type).includes("updated") || normalize(row.activity_type).includes("changed")).length} note="Update actions" icon={<Edit3/>}/><SummaryCard label="Deleted" value={rows.filter(row => normalize(row.activity_type).includes("deleted")).length} note="Delete actions" icon={<Trash2/>}/>
    </> : moduleSummary ? <>{moduleSummary.map(([label,value,note,icon]) => <SummaryCard key={String(label)} label={String(label)} value={Number(value)} note={String(note)} icon={icon as ReactNode}/>)}</> : <>
      <SummaryCard label="Total Records" value={rows.length} note="Live records" icon={<FileUp/>}/><SummaryCard label="Added · 30 Days" value={recentCount} note="Actual created dates" icon={<Plus/>}/><SummaryCard label="Needs Attention" value={attentionCount} note="Review or follow-up" icon={<AlertTriangle/>}/><SummaryCard label="Completed / Active" value={completedCount} note="Current completed records" icon={<CheckCircle2/>}/>
    </>}</section>}

    {moduleKey === "blog-center" && <section className="os-card blog-automation-workspace"><div className="os-card-header"><div><h2>Manual Content Publishing Queue</h2><p>Create topics and one linked blog + social package in AI Content Studio, then review, schedule and publish from the connected queues.</p></div><span className="os-badge green">NO DAILY AI CALL</span></div><div className="os-card-body"><div className="blog-automation-strip"><article><span>1</span><strong>Add Topics</strong><small>Paste one or ten topics into the Topic Inbox</small></article><article><span>2</span><strong>Generate On Demand</strong><small>One API call creates the blog + social pack</small></article><article><span>3</span><strong>SEO / GEO Gate</strong><small>Review scores, keywords and factual copy</small></article><article><span>4</span><strong>Schedule</strong><small>Approved content enters the calendar</small></article></div>{todaysBlogRows.length ? <div className="today-blog-grid">{todaysBlogRows.map(row => <article className="today-blog-card" key={String(row.id)}>{row.featured_image ? <img src={String(row.featured_image)} alt=""/> : <div className="today-blog-image-placeholder"><FileUp/><span>Upload image in Content Studio</span></div>}<div className="today-blog-copy"><div className="today-blog-meta"><span>{titleCase(row.content_type || "blog")}</span><span className={`os-badge ${toneForStatus(row.status)}`}>{titleCase(row.status)}</span></div><h3>{formatValue(row.title)}</h3><p>{formatValue(row.excerpt).slice(0, 180)}</p><div className="today-blog-scores"><span>SEO <b>{Number(row.seo_score || 0)}</b></span><span>GEO <b>{Number(row.geo_score || 0)}</b></span><span>Keyword <b>{formatValue(row.primary_keyword)}</b></span></div><div className="os-row-actions"><button className="os-btn primary" onClick={() => openBlogReview(row)}><BookOpen/>Review Full Blog</button><button className="os-btn soft" onClick={() => openEdit(row)}><Edit3/>Edit Fields</button></div></div></article>)}</div> : <div className="blog-automation-empty"><Sparkles/><strong>No blog draft exists for today.</strong><a className="os-btn primary" href="/admin/content-studio">Open Topic Inbox</a></div>}</div></section>}
    {moduleKey === "faq-intelligence" && <section className="os-card automation-status-card"><div className="os-card-header"><div><h2>Daily Buyer Question Research</h2><p>Public web research creates fresh questions, SEO answers, schema and internal-link suggestions for review.</p></div><span className="os-badge green">06:15 UTC Daily</span></div></section>}
    {moduleKey === "outreach" && <section className="os-card outreach-playbook"><div className="os-card-header"><div><h2>Opportunity-to-Lead Playbook</h2><p>Use each verified opportunity to earn a backlink, supplier listing or direct buyer conversation.</p></div></div><div className="os-card-body"><div className="os-grid four">{[["1. Verify","Confirm the website, relevance, directory rules and real contact details."],["2. Prepare Value","Choose supplier profile, guest article, data contribution or distributor introduction."],["3. Contact","Send a personalized email or LinkedIn message and record the date."],["4. Convert","When a buyer replies, add the person to Contacts and create a Lead with source Backlink Outreach."]].map(([title,text])=><article className="os-playbook-step" key={title}><strong>{title}</strong><p>{text}</p></article>)}</div></div></section>}

    {config.tabs && <div className="os-tabs">{config.tabs.map(tab => <button key={tab.value} className={`os-tab ${activeTab === tab.value ? "active" : ""}`} onClick={() => setActiveTab(tab.value)}>{tab.label}</button>)}</div>}

    <section className="os-card"><div className="os-card-header"><div><h2>{config.title} Records</h2><p>{filtered.length} matching live records</p></div><span className="os-badge green">Supabase</span></div><div className="os-card-body"><div className="os-toolbar"><div className="os-toolbar-left"><label className="os-search-field"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} /></label>{statuses.length > 0 && <select className="os-field" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All Statuses</option>{statuses.map(status => <option key={status} value={status}>{status}</option>)}</select>}<button className="os-btn soft" onClick={() => { setQuery(""); setStatusFilter("all"); setActiveTab(config.tabs?.[0]?.value || "all"); }}><Filter />Reset Filters</button></div></div></div>
      <div className="os-table-wrap"><table className="os-table"><thead><tr>{config.columns.map(column => <th key={column.key}>{column.label}</th>)}{!config.readOnly && <th>Actions</th>}</tr></thead><tbody>{paginated.map(row => <tr key={String(row.id)}>{config.columns.map((column, index) => <td key={column.key}>{renderCell(row, column, index)}</td>)}{!config.readOnly && <td><div className="os-row-actions">{moduleKey === "blog-center" && <button className="os-action-chip primary" onClick={() => openBlogReview(row)}><BookOpen/>Review Blog</button>}{moduleKey === "faq-intelligence" && ["new suggestion", "draft"].includes(normalize(row.status)) && <button className="os-action-chip" onClick={() => void changeWorkflowStatus(row, "In Review")}><Send/>Review</button>}{moduleKey === "faq-intelligence" && normalize(row.status) === "in review" && <button className="os-action-chip success" onClick={() => void changeWorkflowStatus(row, "Approved")}><CheckCircle2/>Approve</button>}{moduleKey === "faq-intelligence" && normalize(row.status) === "approved" && <button className="os-action-chip primary" onClick={() => void changeWorkflowStatus(row, "Published")}><Globe2/>Publish</button>}<button className="os-icon-button" style={{ width: 32, height: 32 }} onClick={() => openEdit(row)} aria-label="Edit record"><Edit3 /></button><button className="os-icon-button" style={{ width: 32, height: 32 }} onClick={() => setDeleteTarget(row)} aria-label="Delete record"><Trash2 /></button></div></td>}</tr>)}</tbody></table></div>
      {!loading && !paginated.length && <div className="os-empty"><div className="os-empty-icon"><Search /></div><h3>{error ? "Live table unavailable" : "No records found"}</h3><p>{error ? "Install the included migration or fix the database connection." : "Create the first real record or wait for live website submissions."}</p>{!config.readOnly && !error && <button className="os-btn primary" onClick={openCreate}><Plus />{config.primaryAction}</button>}</div>}
      {loading && <div className="os-empty"><div className="os-skeleton" style={{ width: "100%", height: 12 }} /><div className="os-skeleton" style={{ width: "82%", height: 12 }} /><div className="os-skeleton" style={{ width: "92%", height: 12 }} /></div>}
      <div className="os-pagination"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div><button disabled={page <= 1} onClick={() => setPage(Math.max(1, page - 1))}>‹</button>{Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1).map(number => <button key={number} className={page === number ? "active" : ""} onClick={() => setPage(number)}>{number}</button>)}<button disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page + 1))}>›</button></div></div>
    </section>

    {reviewing && moduleKey === "blog-center" && <div className="os-modal-backdrop" onMouseDown={() => setReviewing(null)}><section className="os-modal blog-review-modal" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><span className="os-page-eyebrow">Editorial review</span><h2>{formatValue(reviewing.title)}</h2><p className="os-page-subtitle">Review the complete article, researched keywords, SEO metadata and GEO answer readiness before changing its workflow status.</p></div><button className="os-icon-button" onClick={() => setReviewing(null)}><X/></button></div><div className="os-modal-body blog-review-body">
      <div className="blog-review-main"><div className="blog-review-hero">{reviewing.featured_image ? <img src={String(reviewing.featured_image)} alt={String(reviewing.title || "Blog image")}/> : <div className="today-blog-image-placeholder"><Sparkles/><span>Image generation connection required</span></div>}<div><span className={`os-badge ${toneForStatus(reviewing.status)}`}>{titleCase(reviewing.status)}</span><h3>{formatValue(reviewing.title)}</h3><p>{formatValue(reviewing.excerpt)}</p></div></div><div className="blog-review-article" dangerouslySetInnerHTML={{__html:cleanReviewHtml(reviewing.content)}}/></div>
      <aside className="blog-review-side"><section><h3><Gauge/>Quality Scores</h3><div className="blog-score-grid"><article><span>SEO</span><strong>{Number(reviewing.seo_score || 0)}</strong><small>Metadata, keyword use and structure</small></article><article><span>GEO</span><strong>{Number(reviewing.geo_score || 0)}</strong><small>Answer readiness and buyer clarity</small></article></div></section><section><h3><Tag/>Keyword Research</h3><div className="blog-keyword-primary"><span>Primary keyword</span><strong>{formatValue(reviewing.primary_keyword)}</strong></div><div className="blog-keyword-chips">{(Array.isArray(reviewing.keywords) ? reviewing.keywords : String(reviewing.keywords || "").split(",")).filter(Boolean).map((keyword:any,index:number)=><span key={`${String(keyword)}-${index}`}>{String(keyword)}</span>)}</div></section><section><h3><Search/>Search Preview</h3><div className="blog-search-preview"><strong>{formatValue(reviewing.seo_title || reviewing.title)}</strong><span>/{formatValue(reviewing.slug)}</span><p>{formatValue(reviewing.seo_description || reviewing.excerpt)}</p></div></section><section><h3><Globe2/>Publishing Details</h3><dl className="blog-review-details"><div><dt>Target country</dt><dd>{formatValue(reviewing.target_country)}</dd></div><div><dt>Category</dt><dd>{formatValue(reviewing.category)}</dd></div><div><dt>Reading time</dt><dd>{formatValue(reviewing.reading_time)}</dd></div><div><dt>Content type</dt><dd>{titleCase(reviewing.content_type || "blog")}</dd></div></dl></section></aside>
    </div><div className="os-modal-footer blog-review-actions"><button className="os-btn soft" onClick={() => void recalculateBlogQuality(reviewing)}><Gauge/>Recalculate Scores</button><button className="os-btn soft" onClick={() => { setReviewing(null); openEdit(reviewing); }}><Edit3/>Edit Blog</button>{normalize(reviewing.status) === "draft" && <button className="os-btn primary" onClick={() => void changeWorkflowStatus(reviewing, "review")}><Send/>Send to Review</button>}{normalize(reviewing.status) === "review" && <button className="os-btn primary" onClick={() => void changeWorkflowStatus(reviewing, "approved")}><CheckCircle2/>Approve</button>}{normalize(reviewing.status) === "approved" && <button className="os-btn primary" onClick={() => void changeWorkflowStatus(reviewing, "published")}><Globe2/>Publish to Website</button>}<button className="os-btn" onClick={() => setReviewing(null)}>Close</button></div></section></div>}

    {modalOpen && <div className="os-modal-backdrop" onMouseDown={() => setModalOpen(false)}><section className="os-modal" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>{editing ? `Edit ${config.title}` : config.primaryAction}</h2><p className="os-page-subtitle" style={{ marginTop: 3 }}>This saves directly to your authenticated Supabase database.</p></div><button className="os-icon-button" onClick={() => setModalOpen(false)}><X /></button></div><div className="os-modal-body"><div className="os-form-grid">{config.fields.map(field => <label className={`os-label ${field.full ? "full" : ""}`} key={field.key}><span>{field.label}{field.required ? " *" : ""}</span>{field.type === "textarea" || field.type === "json" ? <textarea rows={field.type === "json" ? 7 : 4} value={form[field.key] ?? ""} onChange={event => setForm(previous => ({ ...previous, [field.key]: event.target.value }))} placeholder={field.placeholder} readOnly={field.readOnly} /> : field.type === "select" ? <select value={form[field.key] ?? ""} onChange={event => setForm(previous => ({ ...previous, [field.key]: event.target.value }))}><option value="">Select…</option>{field.options?.map(option => <option key={option} value={option}>{titleCase(option)}</option>)}</select> : field.type === "checkbox" ? <input type="checkbox" checked={Boolean(form[field.key])} onChange={event => setForm(previous => ({ ...previous, [field.key]: event.target.checked }))} style={{ width: 22, height: 22 }} /> : field.type === "file" ? <div style={{ display: "grid", gap: 8 }}><input value={form[field.key] ?? ""} onChange={event => setForm(previous => ({ ...previous, [field.key]: event.target.value }))} placeholder="Public URL or upload a file" /><button type="button" className="os-btn soft" onClick={() => { setFileField(field.key); fileInput.current?.click(); }}><UploadCloud />Upload File</button></div> : <input type={field.type === "datetime" ? "datetime-local" : field.type === "date" ? "date" : field.type === "number" ? "number" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"} value={form[field.key] ?? ""} onChange={event => setForm(previous => ({ ...previous, [field.key]: event.target.value }))} placeholder={field.placeholder} readOnly={field.readOnly} />}</label>)}</div>{error && <p className="premium-login-error" style={{ marginTop: 14 }}>{error}</p>}</div><div className="os-modal-footer"><button className="os-btn" onClick={() => setModalOpen(false)}>Cancel</button><button className="os-btn primary" onClick={saveRecord} disabled={saving}>{saving ? "Saving…" : "Save Record"}</button></div></section></div>}

    {deleteTarget && <div className="os-modal-backdrop" onMouseDown={() => setDeleteTarget(null)}><section className="os-modal" style={{ maxWidth: 520 }} onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>Delete record?</h2><p className="os-page-subtitle" style={{ marginTop: 3 }}>This permanently removes the selected live database record.</p></div><button className="os-icon-button" onClick={() => setDeleteTarget(null)}><X /></button></div><div className="os-modal-body"><strong>{formatValue(deleteTarget[config.columns[0]?.key])}</strong></div><div className="os-modal-footer"><button className="os-btn" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="os-btn danger" onClick={deleteRecord} disabled={saving}><Trash2 />{saving ? "Deleting…" : "Delete"}</button></div></section></div>}

    <input ref={fileInput} type="file" hidden onChange={uploadFile} />
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2 /></span><div><strong>{toast}</strong><span>The action was applied to the live CMS data source.</span></div><ChevronRight /></div></div>}
  </div>;
}

function SummaryCard({ label, value, note, icon }: { label: string; value: number; note: string; icon: ReactNode }) {
  return <article className="os-metric compact"><div className="os-metric-top"><span className="os-metric-label">{label}</span><span className="os-metric-icon">{icon}</span></div><div className="os-metric-value">{value}</div><div className="os-metric-foot"><b>{note}</b><span className="os-source-badge">LIVE</span></div></article>;
}
