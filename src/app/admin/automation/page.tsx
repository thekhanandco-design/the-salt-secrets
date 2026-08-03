"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import { AlertTriangle, Bell, Check, CheckCircle2, Clock3, Edit3, FileText, Pause, Play, Plus, RefreshCw, Save, ShieldCheck, Sparkles, Trash2, Workflow, X } from "lucide-react";

type NodeType = "Trigger" | "AI Action" | "Content Action" | "CRM Action" | "Condition" | "Delay" | "Approval" | "Publish" | "Notification";
type Node = { id: string; title: string; description: string; type: NodeType };
type Row = Record<string, any>;
const nodeTypes: NodeType[] = ["Trigger", "AI Action", "Content Action", "CRM Action", "Condition", "Delay", "Approval", "Publish", "Notification"];
const templates: Record<string, Node[]> = {
  "New Blog Distribution": [
    { id: "trigger", title: "Blog Draft Ready", description: "Start when a real blog draft is selected.", type: "Trigger" },
    { id: "social", title: "Generate Social Versions", description: "Create separate draft content for selected social platforms.", type: "AI Action" },
    { id: "newsletter", title: "Generate Newsletter Summary", description: "Prepare a draft newsletter summary.", type: "AI Action" },
    { id: "review", title: "Human Review Required", description: "Stop before any schedule or publish action.", type: "Approval" },
    { id: "schedule", title: "Schedule Approved Assets", description: "Continue only after recorded approval.", type: "Publish" },
    { id: "notify", title: "Notify Team", description: "Create a completion notification.", type: "Notification" },
  ],
  "New Lead Follow-Up": [
    { id: "trigger", title: "New Lead Created", description: "Start when a real inquiry enters the CRM.", type: "Trigger" },
    { id: "assign", title: "Assign Owner", description: "Assign the configured lead manager.", type: "CRM Action" },
    { id: "task", title: "Create Follow-Up", description: "Create a follow-up task with the configured delay.", type: "CRM Action" },
    { id: "notify", title: "Notify Owner", description: "Send an internal notification.", type: "Notification" },
  ],
  "Quotation Follow-Up Reminder": [
    { id: "trigger", title: "Quotation Sent", description: "Start from a real quotation status change.", type: "Trigger" },
    { id: "delay", title: "Wait Until Follow-Up", description: "Use the quotation next follow-up date.", type: "Delay" },
    { id: "condition", title: "Check Quotation Status", description: "Stop if accepted, rejected or expired.", type: "Condition" },
    { id: "task", title: "Create Follow-Up Task", description: "Create a real CRM follow-up record.", type: "CRM Action" },
    { id: "notify", title: "Notify Owner", description: "Notify the assigned manager.", type: "Notification" },
  ],
  "FAQ Review Workflow": [
    { id: "trigger", title: "FAQ Draft Ready", description: "Start from an FAQ Intelligence draft.", type: "Trigger" },
    { id: "review", title: "Human Review Required", description: "Reviewer must approve or request changes.", type: "Approval" },
    { id: "publish", title: "Publish Approved FAQ", description: "Publish only an approved FAQ.", type: "Publish" },
  ],
  "Social Content Approval": [
    { id: "trigger", title: "Social Draft Ready", description: "Start from a saved social draft.", type: "Trigger" },
    { id: "review", title: "Human Review Required", description: "Review platform copy and images.", type: "Approval" },
    { id: "schedule", title: "Schedule Approved Platforms", description: "Schedule only approved platform versions.", type: "Publish" },
  ],
  "Certification Expiry Reminder": [
    { id: "trigger", title: "Expiry Window Reached", description: "Start from a real certification expiry date.", type: "Trigger" },
    { id: "condition", title: "Check Current Status", description: "Continue only for valid or expiring records.", type: "Condition" },
    { id: "notify", title: "Notify Compliance Owner", description: "Create an internal expiry notification.", type: "Notification" },
  ],
  "Dormant Lead Reactivation": [
    { id: "trigger", title: "Dormant Lead Selected", description: "Start from a real dormant lead.", type: "Trigger" },
    { id: "draft", title: "Prepare Follow-Up Draft", description: "Generate a draft using recorded lead context only.", type: "AI Action" },
    { id: "review", title: "Human Review Required", description: "Approve the communication before sending.", type: "Approval" },
    { id: "task", title: "Create Contact Task", description: "Create a follow-up task after approval.", type: "CRM Action" },
  ],
};
function normal(value: unknown) { return String(value || "").trim().toLowerCase().replaceAll("_", " "); }
function iconFor(type: NodeType) { return type === "AI Action" ? Sparkles : type === "Approval" ? ShieldCheck : type === "Delay" ? Clock3 : type === "Notification" ? Bell : type === "Publish" ? CheckCircle2 : type === "Content Action" ? FileText : Workflow; }

export default function AutomationPage() {
  const [tab, setTab] = useState("Builder");
  const [workflows, setWorkflows] = useState<Row[]>([]);
  const [runs, setRuns] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [runModal, setRunModal] = useState<Row | null>(null);
  const [nodeModal, setNodeModal] = useState(false);
  const [nodeForm, setNodeForm] = useState<Node>({ id: "", title: "", description: "", type: "AI Action" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [workflowResult, runResult] = await Promise.all([
      supabase.from("automation_workflows").select("*").order("updated_at", { ascending: false }).limit(200),
      supabase.from("automation_runs").select("*").order("created_at", { ascending: false }).limit(300),
    ]);
    if (workflowResult.error) setError(workflowResult.error.message);
    setWorkflows(workflowResult.data || []); setRuns(runResult.data || []); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);

  const activeCount = workflows.filter(row => row.enabled).length;
  const waitingCount = runs.filter(row => normal(row.status) === "waiting approval").length;
  const completedCount = runs.filter(row => normal(row.status) === "completed").length;
  const successRate = runs.length ? Math.round((completedCount / runs.length) * 1000) / 10 : 0;

  function applyTemplate(templateName: string) { setName(templateName); setNodes(templates[templateName].map(node => ({ ...node, id: crypto.randomUUID() }))); setEditingId(null); setTab("Builder"); setToast("Workflow template loaded. Save it to create a live workflow."); }
  function reset() { setName(""); setNodes([]); setEditingId(null); setError(""); }
  function editWorkflow(row: Row) { setEditingId(row.id); setName(String(row.name || "")); setNodes(Array.isArray(row.nodes) ? row.nodes : []); setTab("Builder"); }
  function openAddNode() { setNodeForm({ id: crypto.randomUUID(), title: "", description: "", type: "AI Action" }); setNodeModal(true); }
  function addNode() { if (!nodeForm.title.trim()) { setError("Node title is required."); return; } setNodes(previous => [...previous, nodeForm]); setNodeModal(false); }
  function moveNode(index: number, direction: number) { const target = index + direction; if (target < 0 || target >= nodes.length) return; const next = [...nodes]; [next[index], next[target]] = [next[target], next[index]]; setNodes(next); }
  function removeNode(id: string) { setNodes(previous => previous.filter(node => node.id !== id)); }

  async function saveWorkflow() {
    if (!name.trim()) { setError("Workflow name is required."); return; }
    if (!nodes.length) { setError("Add at least one workflow node."); return; }
    const firstPublish = nodes.findIndex(node => node.type === "Publish");
    const firstApproval = nodes.findIndex(node => node.type === "Approval");
    if (firstPublish >= 0 && (firstApproval < 0 || firstApproval > firstPublish)) { setError("A human approval node must appear before every publish action."); return; }
    setWorking(true); setError("");
    const payload = { name: name.trim(), nodes, enabled: true, approval_required: true, updated_at: new Date().toISOString() };
    const result = editingId ? await supabase.from("automation_workflows").update(payload).eq("id", editingId) : await supabase.from("automation_workflows").insert(payload);
    if (result.error) setError(result.error.message); else { setToast("Workflow saved to the live database."); await load(); }
    setWorking(false);
  }

  async function runWorkflow(row: Row) {
    const workflowNodes = Array.isArray(row.nodes) ? row.nodes as Node[] : [];
    if (!workflowNodes.length) { setError("This workflow has no nodes."); return; }
    setWorking(true); setError("");
    const approvalIndex = workflowNodes.findIndex(node => node.type === "Approval");
    const completedNodes = approvalIndex >= 0 ? workflowNodes.slice(0, approvalIndex).map(node => node.id) : workflowNodes.map(node => node.id);
    const status = approvalIndex >= 0 ? "Waiting Approval" : "Completed";
    const runResult = await supabase.from("automation_runs").insert({ workflow_id: row.id, workflow_name: row.name, status, current_node_index: approvalIndex >= 0 ? approvalIndex : workflowNodes.length, steps: workflowNodes, completed_node_ids: completedNodes, started_at: new Date().toISOString(), completed_at: approvalIndex < 0 ? new Date().toISOString() : null }).select().single();
    if (runResult.error) { setError(runResult.error.message); setWorking(false); return; }
    if (approvalIndex >= 0) {
      const approvalResult = await supabase.from("approval_items").insert({ content_type: "Automation", record_id: runResult.data.id, title: `${row.name} approval`, creator_name: "Automation", ai_agent: "Workflow Engine", status: "Needs Review", change_summary: "Workflow paused before its first publish action.", metadata: { workflow_id: row.id, run_id: runResult.data.id } }).select().single();
      if (approvalResult.error) setError(approvalResult.error.message);
      else await supabase.from("automation_runs").update({ approval_item_id: approvalResult.data.id }).eq("id", runResult.data.id);
    }
    setToast(status === "Waiting Approval" ? "Workflow paused for human approval." : "Workflow run completed."); await load(); setWorking(false); setRunModal(runResult.data);
  }

  async function approveRun(run: Row) {
    setWorking(true); setError("");
    const result = await supabase.from("automation_runs").update({ status: "Completed", current_node_index: Array.isArray(run.steps) ? run.steps.length : run.current_node_index, completed_node_ids: Array.isArray(run.steps) ? run.steps.map((node: Node) => node.id) : run.completed_node_ids, approved_at: new Date().toISOString(), completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", run.id);
    if (result.error) setError(result.error.message); else {
      if (run.approval_item_id) await supabase.from("approval_items").update({ status: "Approved", reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", run.approval_item_id);
      setToast("Approval recorded and workflow completed."); setRunModal(null); await load();
    }
    setWorking(false);
  }

  async function rejectRun(run: Row) {
    setWorking(true);
    const result = await supabase.from("automation_runs").update({ status: "Rejected", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", run.id);
    if (result.error) setError(result.error.message); else {
      if (run.approval_item_id) await supabase.from("approval_items").update({ status: "Rejected", reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", run.approval_item_id);
      setToast("Workflow run rejected."); setRunModal(null); await load();
    }
    setWorking(false);
  }

  async function removeWorkflow(row: Row) { if (!confirm(`Delete ${row.name}?`)) return; const result = await supabase.from("automation_workflows").delete().eq("id", row.id); if (result.error) setError(result.error.message); else { setToast("Workflow deleted."); await load(); } }

  const selectedWorkflow = useMemo(() => workflows.find(row => row.id === editingId), [editingId, workflows]);

  return <AdminShell><div className="os-page">
    <header className="os-page-header"><div><div className="os-page-eyebrow">Human-controlled workflow engine</div><h1 className="os-page-title">Automation</h1><p className="os-page-subtitle">Save real workflows, create auditable runs and stop every publishing flow at a mandatory human approval step.</p></div><div className="os-page-actions"><button className="os-btn soft" onClick={reset}><RefreshCw/>New Workflow</button><button className="os-btn soft" onClick={openAddNode}><Plus/>Add Node</button><button className="os-btn primary" onClick={() => void saveWorkflow()} disabled={working}><Save/>{working ? "Saving…" : "Save Workflow"}</button></div></header>
    {error && <section className="os-card" style={{ borderColor: "rgba(239,68,68,.35)" }}><div className="os-card-body" style={{ display: "flex", gap: 12 }}><AlertTriangle/><div><strong>Live automation error</strong><p className="os-page-subtitle">{error}</p></div></div></section>}
    <section className="os-grid four">{[["Active Workflows", activeCount, Workflow], ["Recorded Runs", runs.length, Play], ["Waiting Approval", waitingCount, ShieldCheck], ["Completion Rate", `${successRate}%`, CheckCircle2]].map(([label, value, Icon]) => { const Component = Icon as typeof Workflow; return <article className="os-metric" key={String(label)}><div className="os-metric-top"><span className="os-metric-label">{String(label)}</span><span className="os-metric-icon"><Component/></span></div><div className="os-metric-value">{String(value)}</div><div className="os-metric-foot"><b>Live database records</b><span className="os-source-badge">DB</span></div></article>; })}</section>
    <div className="os-tabs">{["Builder", "Saved Workflows", "Templates", "Runs", "Approvals"].map(value => <button className={`os-tab ${tab === value ? "active" : ""}`} onClick={() => setTab(value)} key={value}>{value}</button>)}</div>

    {tab === "Builder" && <div className="os-grid" style={{ gridTemplateColumns: "minmax(0,1fr) 330px" }}><section className="os-card"><div className="os-card-header"><div><h2>{editingId ? "Edit Workflow" : "Workflow Builder"}</h2><p>Publish nodes are blocked unless an approval node comes first</p></div><span className="os-badge blue">{nodes.length} nodes</span></div><div className="os-card-body"><label className="os-label"><span>Workflow Name *</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Enter a workflow name"/></label></div><div className="os-workflow"><div className="os-workflow-track">{nodes.length ? nodes.map((node, index) => { const Icon = iconFor(node.type); return <div key={node.id} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}><article className={`os-workflow-node ${node.type === "Approval" ? "approval" : ""}`}><span className="os-node-icon"><Icon/></span><div><strong>{node.title}</strong><span>{node.description || "No description"}</span></div><span className="os-badge">{node.type}</span><div className="os-table-actions"><button onClick={() => moveNode(index, -1)} disabled={index === 0}>↑</button><button onClick={() => moveNode(index, 1)} disabled={index === nodes.length - 1}>↓</button><button onClick={() => removeNode(node.id)}><Trash2/></button></div></article>{index < nodes.length - 1 && <div className="os-workflow-arrow">↓</div>}</div>; }) : <div className="os-empty"><div className="os-empty-icon"><Workflow/></div><h3>No nodes added</h3><p>Load a template or add nodes to create the first real workflow.</p><button className="os-btn primary" onClick={openAddNode}><Plus/>Add Node</button></div>}</div></div></section><aside style={{ display: "flex", flexDirection: "column", gap: 12 }}><section className="os-card"><div className="os-card-header"><div><h2>Safety Check</h2><p>Mandatory publishing control</p></div><ShieldCheck/></div><div className="os-card-body"><div className="os-list"><div className="os-list-row"><span className="os-list-icon"><Check/></span><div className="os-list-main"><strong>Human approval</strong><span>{nodes.some(node => node.type === "Approval") ? "Included" : "Not included"}</span></div></div><div className="os-list-row"><span className="os-list-icon"><Pause/></span><div className="os-list-main"><strong>Auto-publish</strong><span>Blocked before approval</span></div></div></div></div></section><section className="os-card"><div className="os-card-header"><div><h2>Node Types</h2><p>Add workflow actions</p></div></div><div className="os-card-body"><div className="os-grid two">{nodeTypes.map(type => <button className="os-tool-button" key={type} onClick={() => { setNodeForm({ id: crypto.randomUUID(), title: "", description: "", type }); setNodeModal(true); }}><Plus/>{type}</button>)}</div></div></section>{selectedWorkflow && <button className="os-btn primary" onClick={() => void runWorkflow(selectedWorkflow)} disabled={working}><Play/>Run Saved Workflow</button>}</aside></div>}

    {tab === "Templates" && <section className="os-card"><div className="os-card-header"><div><h2>Workflow Templates</h2><p>Templates contain no business records and must be saved before use</p></div></div><div className="os-card-body"><div className="os-grid three">{Object.entries(templates).map(([templateName, templateNodes]) => <article className="os-kanban-card" key={templateName}><span className="os-list-icon"><Workflow/></span><h3 style={{ fontSize: 13, margin: "12px 0 5px" }}>{templateName}</h3><p>{templateNodes.length} workflow nodes · {templateNodes.some(node => node.type === "Approval") ? "Human approval included" : "Operational workflow"}</p><footer><span>{templateNodes.map(node => node.type).filter((value, index, array) => array.indexOf(value) === index).join(" · ")}</span><button className="os-btn soft" onClick={() => applyTemplate(templateName)}>Use Template</button></footer></article>)}</div></div></section>}

    {tab === "Saved Workflows" && <section className="os-card"><div className="os-card-header"><div><h2>Saved Workflows</h2><p>{workflows.length} live workflow records</p></div></div><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Name</th><th>Nodes</th><th>Approval Required</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{workflows.map(row => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{Array.isArray(row.nodes) ? row.nodes.length : 0}</td><td>{row.approval_required ? "Yes" : "No"}</td><td><span className={`os-badge ${row.enabled ? "green" : "amber"}`}>{row.enabled ? "Active" : "Paused"}</span></td><td>{row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}</td><td><div className="os-table-actions"><button onClick={() => editWorkflow(row)}><Edit3/></button><button onClick={() => void runWorkflow(row)}><Play/></button><button onClick={() => void removeWorkflow(row)}><Trash2/></button></div></td></tr>)}</tbody></table></div>{!loading && !workflows.length && <Empty title="No workflows saved" text="Create or load a template, then save the first live workflow."/>}</section>}

    {tab === "Runs" && <section className="os-card"><div className="os-card-header"><div><h2>Automation Runs</h2><p>Actual workflow execution records</p></div></div><div className="os-table-wrap"><table className="os-table"><thead><tr><th>Workflow</th><th>Status</th><th>Started</th><th>Completed</th><th>Progress</th><th>Actions</th></tr></thead><tbody>{runs.map(run => <tr key={run.id}><td><strong>{run.workflow_name || "Unnamed workflow"}</strong></td><td><span className={`os-badge ${normal(run.status) === "completed" ? "green" : normal(run.status).includes("waiting") ? "amber" : normal(run.status) === "rejected" ? "red" : "blue"}`}>{run.status}</span></td><td>{run.started_at ? new Date(run.started_at).toLocaleString() : "—"}</td><td>{run.completed_at ? new Date(run.completed_at).toLocaleString() : "—"}</td><td>{Array.isArray(run.steps) ? `${Array.isArray(run.completed_node_ids) ? run.completed_node_ids.length : 0} / ${run.steps.length}` : "—"}</td><td><button className="os-btn soft" onClick={() => setRunModal(run)}>View</button></td></tr>)}</tbody></table></div>{!loading && !runs.length && <Empty title="No workflow runs" text="Run a saved workflow to create the first execution record."/>}</section>}

    {tab === "Approvals" && <section className="os-card"><div className="os-card-header"><div><h2>Waiting Automation Approvals</h2><p>Only real paused workflow runs appear here</p></div></div><div className="os-card-body"><div className="os-list">{runs.filter(run => normal(run.status) === "waiting approval").map(run => <button className="os-list-row" key={run.id} onClick={() => setRunModal(run)}><span className="os-list-icon"><ShieldCheck/></span><div className="os-list-main"><strong>{run.workflow_name}</strong><span>Started {run.started_at ? new Date(run.started_at).toLocaleString() : "—"}</span></div><span className="os-badge amber">Needs Review</span></button>)}</div>{!waitingCount && <Empty title="No approvals waiting" text="There are no paused automation runs requiring review."/>}</div></section>}

    {nodeModal && <div className="os-modal-backdrop" onMouseDown={() => setNodeModal(false)}><section className="os-modal" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><h2>Add Workflow Node</h2><button className="os-icon-button" onClick={() => setNodeModal(false)}><X/></button></div><div className="os-modal-body"><div className="os-form-grid"><label className="os-label"><span>Node Type</span><select value={nodeForm.type} onChange={event => setNodeForm(previous => ({ ...previous, type: event.target.value as NodeType }))}>{nodeTypes.map(type => <option key={type}>{type}</option>)}</select></label><label className="os-label"><span>Title *</span><input value={nodeForm.title} onChange={event => setNodeForm(previous => ({ ...previous, title: event.target.value }))}/></label><label className="os-label full"><span>Description</span><textarea value={nodeForm.description} onChange={event => setNodeForm(previous => ({ ...previous, description: event.target.value }))}/></label></div></div><div className="os-modal-footer"><button className="os-btn soft" onClick={() => setNodeModal(false)}>Cancel</button><button className="os-btn primary" onClick={addNode}><Plus/>Add Node</button></div></section></div>}

    {runModal && <div className="os-modal-backdrop" onMouseDown={() => setRunModal(null)}><section className="os-modal wide" onMouseDown={event => event.stopPropagation()}><div className="os-modal-header"><div><h2>{runModal.workflow_name || "Workflow Run"}</h2><p className="os-page-subtitle">Run ID: {runModal.id}</p></div><button className="os-icon-button" onClick={() => setRunModal(null)}><X/></button></div><div className="os-modal-body"><div className="os-list">{(Array.isArray(runModal.steps) ? runModal.steps : []).map((node: Node, index: number) => <div className="os-list-row" key={node.id}><span className="os-list-icon">{(Array.isArray(runModal.completed_node_ids) && runModal.completed_node_ids.includes(node.id)) ? <CheckCircle2/> : index === runModal.current_node_index ? <Pause/> : <Clock3/>}</span><div className="os-list-main"><strong>{node.title}</strong><span>{node.description}</span></div><span className="os-badge">{node.type}</span></div>)}</div>{normal(runModal.status) === "waiting approval" && <div className="os-card" style={{ marginTop: 14, boxShadow: "none" }}><div className="os-card-body"><strong>Human approval required</strong><p className="os-page-subtitle">No publish action can continue until this run is approved.</p></div></div>}</div><div className="os-modal-footer"><button className="os-btn soft" onClick={() => setRunModal(null)}>Close</button>{normal(runModal.status) === "waiting approval" && <><button className="os-btn danger" onClick={() => void rejectRun(runModal)} disabled={working}>Reject</button><button className="os-btn primary" onClick={() => void approveRun(runModal)} disabled={working}><Check/>Approve & Continue</button></>}</div></section></div>}
    {toast && <div className="os-toast-stack"><div className="os-toast"><span className="os-toast-icon"><CheckCircle2/></span><div><strong>{toast}</strong><span>The workflow state was saved to Supabase.</span></div></div></div>}
  </div></AdminShell>;
}

function Empty({ title, text }: { title: string; text: string }) { return <div className="os-empty"><div className="os-empty-icon"><Workflow/></div><h3>{title}</h3><p>{text}</p></div>; }
