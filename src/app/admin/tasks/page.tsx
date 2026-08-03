"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase-client";
import {
  Bell,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Edit3,
  LayoutList,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  assigned_name: string;
  assigned_user_id?: string | null;
  status: string;
  priority: string;
  due_at?: string | null;
  reminder_at?: string | null;
  reminder_sent_at?: string | null;
  recurring_rule?: string | null;
  list_name?: string | null;
  labels?: string[] | null;
  module?: string | null;
  related_record_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

type TaskForm = {
  title: string;
  description: string;
  assigned_name: string;
  status: string;
  priority: string;
  due_at: string;
  reminder_at: string;
  recurring_rule: string;
  list_name: string;
  module: string;
  labels: string;
};

const statusOptions = [
  "To Do",
  "In Progress",
  "Waiting",
  "Review",
  "Completed",
  "Cancelled",
];

const priorityOptions = ["Low", "Normal", "High", "Urgent"];
const recurrenceOptions = ["None", "Daily", "Weekly", "Monthly"];
const viewOptions = ["All", "Today", "Upcoming", "Overdue", "Completed"];

const blankForm: TaskForm = {
  title: "",
  description: "",
  assigned_name: "",
  status: "To Do",
  priority: "Normal",
  due_at: "",
  reminder_at: "",
  recurring_rule: "None",
  list_name: "General",
  module: "",
  labels: "",
};

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function toLocalInput(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

function dueLabel(value?: string | null) {
  if (!value) return "No due date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";

  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();

  return sameDay
    ? `Today · ${date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function reminderLabel(value?: string | null) {
  if (!value) return "No reminder";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No reminder";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function nextRecurringDate(
  value: string | null | undefined,
  rule: string,
) {
  const base = value ? new Date(value) : new Date();

  if (rule === "Daily") {
    base.setDate(base.getDate() + 1);
  }

  if (rule === "Weekly") {
    base.setDate(base.getDate() + 7);
  }

  if (rule === "Monthly") {
    base.setMonth(base.getMonth() + 1);
  }

  return base.toISOString();
}

function TeamTasksPageContent() {
  const params = useSearchParams();

  const [rows, setRows] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeView, setActiveView] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(blankForm);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const reminderHandled = useRef(new Set<string>());

  async function load() {
    setLoading(true);
    setError("");

    const result = await supabase
      .from("team_tasks")
      .select("*")
      .order("due_at", {
        ascending: true,
        nullsFirst: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (result.error) {
      setError(result.error.message);
    } else {
      setRows((result.data || []) as Task[]);
    }

    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(row: Task) {
    setEditing(row);

    setForm({
      title: row.title,
      description: row.description || "",
      assigned_name: row.assigned_name,
      status: row.status,
      priority: row.priority,
      due_at: toLocalInput(row.due_at),
      reminder_at: toLocalInput(row.reminder_at),
      recurring_rule: row.recurring_rule || "None",
      list_name: row.list_name || "General",
      module: row.module || "",
      labels: (row.labels || []).join(", "),
    });

    setError("");
    setModalOpen(true);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (params.get("action") === "create") {
      openCreate();
    }
  }, [params]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast("");
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  useEffect(() => {
    if (loading || !rows.length) return;

    const now = Date.now();

    const due = rows.filter((task) => {
      if (!task.reminder_at) return false;

      return (
        new Date(task.reminder_at).getTime() <= now &&
        !task.reminder_sent_at &&
        !["completed", "cancelled"].includes(
          normalize(task.status),
        ) &&
        !reminderHandled.current.has(task.id)
      );
    });

    if (!due.length) return;

    due.forEach((task) => {
      reminderHandled.current.add(task.id);
    });

    setToast(
      `${due.length} task reminder${
        due.length === 1 ? "" : "s"
      } need attention now.`,
    );

    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      due.forEach((task) => {
        new Notification(task.title, {
          body: `${task.assigned_name} · ${dueLabel(
            task.due_at,
          )}`,
          icon: "/salt-origin-logo.png",
        });
      });
    }

    void Promise.all(
      due.map((task) =>
        supabase
          .from("team_tasks")
          .update({
            reminder_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.id),
      ),
    );
  }, [loading, rows]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const needle = query.trim().toLowerCase();

      const textMatch =
        !needle ||
        `${row.title} ${row.description || ""} ${
          row.assigned_name
        } ${row.module || ""} ${row.list_name || ""} ${(
          row.labels || []
        ).join(" ")}`
          .toLowerCase()
          .includes(needle);

      const statusMatch =
        statusFilter === "All" ||
        normalize(row.status) === normalize(statusFilter);

      const now = new Date();
      const endToday = new Date();

      endToday.setHours(23, 59, 59, 999);

      const due = row.due_at ? new Date(row.due_at) : null;
      const open = !["completed", "cancelled"].includes(
        normalize(row.status),
      );

      const viewMatch =
        activeView === "All" ||
        (activeView === "Today" &&
          due &&
          due <= endToday &&
          due.toDateString() === now.toDateString() &&
          open) ||
        (activeView === "Upcoming" &&
          due &&
          due > endToday &&
          open) ||
        (activeView === "Overdue" &&
          due &&
          due < now &&
          open) ||
        (activeView === "Completed" &&
          normalize(row.status) === "completed");

      return textMatch && statusMatch && Boolean(viewMatch);
    });
  }, [rows, query, statusFilter, activeView]);

  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();

    filtered.forEach((task) => {
      const owner = task.assigned_name.trim() || "Unassigned";

      map.set(owner, [...(map.get(owner) || []), task]);
    });

    return [...map.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
  }, [filtered]);

  const openCount = rows.filter(
    (row) =>
      !["completed", "cancelled"].includes(
        normalize(row.status),
      ),
  ).length;

  const dueToday = rows.filter(
    (row) =>
      row.due_at &&
      new Date(row.due_at).toDateString() ===
        new Date().toDateString() &&
      !["completed", "cancelled"].includes(
        normalize(row.status),
      ),
  ).length;

  const overdue = rows.filter(
    (row) =>
      row.due_at &&
      new Date(row.due_at) < new Date() &&
      !["completed", "cancelled"].includes(
        normalize(row.status),
      ),
  ).length;

  const reminderCount = rows.filter(
    (row) =>
      row.reminder_at &&
      new Date(row.reminder_at) <= new Date() &&
      !row.reminder_sent_at &&
      !["completed", "cancelled"].includes(
        normalize(row.status),
      ),
  ).length;

  async function enableBrowserReminders() {
    if (typeof Notification === "undefined") {
      setError(
        "Browser notifications are not supported on this device.",
      );
      return;
    }

    const permission = await Notification.requestPermission();

    setToast(
      permission === "granted"
        ? "Browser task reminders enabled."
        : "Browser task reminders were not enabled.",
    );
  }

  async function save() {
    if (
      !form.title.trim() ||
      !form.assigned_name.trim()
    ) {
      setError(
        "Task title and assigned person are required.",
      );
      return;
    }

    setSaving(true);
    setError("");

    const session = await supabase.auth.getSession();

    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      assigned_name: form.assigned_name.trim(),
      status: form.status,
      priority: form.priority,
      due_at: form.due_at
        ? new Date(form.due_at).toISOString()
        : null,
      reminder_at: form.reminder_at
        ? new Date(form.reminder_at).toISOString()
        : null,
      reminder_sent_at:
        editing &&
        toLocalInput(editing.reminder_at) ===
          form.reminder_at
          ? editing.reminder_sent_at || null
          : null,
      recurring_rule: form.recurring_rule,
      list_name: form.list_name.trim() || "General",
      labels: form.labels
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean),
      module: form.module.trim() || null,
      updated_at: new Date().toISOString(),
      ...(editing
        ? {}
        : {
            created_by:
              session.data.session?.user.id || null,
          }),
      ...(normalize(form.status) === "completed"
        ? {
            completed_at: new Date().toISOString(),
          }
        : {
            completed_at: null,
          }),
    };

    const request = editing
      ? supabase
          .from("team_tasks")
          .update(payload)
          .eq("id", editing.id)
      : supabase.from("team_tasks").insert(payload);

    const result = await request
      .select("*")
      .single();

    if (result.error) {
      setError(result.error.message);
    } else {
      setToast(
        editing ? "Task updated" : "Task created",
      );
      setModalOpen(false);
      await load();
    }

    setSaving(false);
  }

  async function updateStatus(
    row: Task,
    status: string,
  ) {
    const completed =
      normalize(status) === "completed";

    const result = await supabase
      .from("team_tasks")
      .update({
        status,
        completed_at: completed
          ? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .select("*")
      .single();

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (
      completed &&
      row.recurring_rule &&
      row.recurring_rule !== "None"
    ) {
      const nextDue = nextRecurringDate(
        row.due_at,
        row.recurring_rule,
      );

      let nextReminder: string | null = null;

      if (row.reminder_at && row.due_at) {
        const offset =
          new Date(row.due_at).getTime() -
          new Date(row.reminder_at).getTime();

        nextReminder = new Date(
          new Date(nextDue).getTime() - offset,
        ).toISOString();
      }

      await supabase.from("team_tasks").insert({
        title: row.title,
        description: row.description || null,
        assigned_name: row.assigned_name,
        assigned_user_id:
          row.assigned_user_id || null,
        status: "To Do",
        priority: row.priority,
        due_at: nextDue,
        reminder_at: nextReminder,
        recurring_rule: row.recurring_rule,
        list_name: row.list_name || "General",
        labels: row.labels || [],
        module: row.module || null,
        related_record_id:
          row.related_record_id || null,
      });

      setToast(
        `Task completed. Next ${row.recurring_rule.toLowerCase()} task created.`,
      );
    } else {
      setToast("Task status updated");
    }

    await load();
  }

  async function remove(row: Task) {
    if (!confirm(`Delete “${row.title}”?`)) {
      return;
    }

    const result = await supabase
      .from("team_tasks")
      .delete()
      .eq("id", row.id);

    if (result.error) {
      setError(result.error.message);
    } else {
      setRows((current) =>
        current.filter((item) => item.id !== row.id),
      );
      setToast("Task deleted");
    }
  }

  return (
    <AdminShell>
      <div className="os-page clickup-task-page">
        <header className="os-page-header">
          <div>
            <div className="os-page-eyebrow">
              Daily team execution
            </div>

            <h1 className="os-page-title">
              Team Tasks
            </h1>

            <p className="os-page-subtitle">
              ClickUp-style task lists, owners, due dates,
              reminders and recurring work connected to the
              live CMS.
            </p>
          </div>

          <div className="os-page-actions">
            <button
              className="os-btn soft"
              onClick={() =>
                void enableBrowserReminders()
              }
            >
              <BellRing />
              Enable Reminders
            </button>

            <button
              className="os-btn soft"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>

            <button
              className="os-btn primary"
              onClick={openCreate}
            >
              <Plus />
              Add Task
            </button>
          </div>
        </header>

        {error && (
          <section className="os-card">
            <div className="os-card-body">
              <strong>Task action failed</strong>
              <p className="os-page-subtitle">
                {error}
              </p>
            </div>
          </section>
        )}

        <section className="os-summary-four compact-summary">
          <article className="os-summary-card">
            <span>Open Tasks</span>
            <strong>{openCount}</strong>
            <small>
              To do, in progress, waiting or review
            </small>
          </article>

          <article className="os-summary-card">
            <span>Due Today</span>
            <strong>{dueToday}</strong>
            <small>
              Tasks requiring attention today
            </small>
          </article>

          <article className="os-summary-card">
            <span>Overdue</span>
            <strong>{overdue}</strong>
            <small>Past due and still open</small>
          </article>

          <article className="os-summary-card">
            <span>Reminders Now</span>
            <strong>{reminderCount}</strong>
            <small>Reminder time reached</small>
          </article>
        </section>

        <section className="os-card">
          <div className="os-card-body task-toolbar">
            <div className="task-view-tabs">
              {viewOptions.map((view) => (
                <button
                  key={view}
                  className={
                    activeView === view ? "active" : ""
                  }
                  onClick={() => setActiveView(view)}
                >
                  {view === "All" ? (
                    <LayoutList />
                  ) : view === "Today" ? (
                    <CalendarDays />
                  ) : view === "Overdue" ? (
                    <Clock3 />
                  ) : view === "Completed" ? (
                    <CheckCircle2 />
                  ) : (
                    <ListTodo />
                  )}

                  {view}
                </button>
              ))}
            </div>

            <div className="task-toolbar-filters">
              <label className="os-search-field">
                <Search />

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Search tasks, people, lists or modules…"
                />
              </label>

              <label className="os-filter-select">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option>All</option>

                  {statusOptions.map((status) => (
                    <option key={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <ChevronDown />
              </label>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="os-card">
            <div className="os-card-body">
              <div
                className="os-skeleton"
                style={{ height: 160 }}
              />
            </div>
          </section>
        ) : grouped.length ? (
          <div className="team-task-board">
            {grouped.map(([owner, tasks]) => (
              <section
                className="os-card team-task-column"
                key={owner}
              >
                <div className="os-card-header">
                  <div className="team-owner">
                    <span className="os-avatar">
                      {owner
                        .split(/\s+/)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>

                    <div>
                      <h2>{owner}</h2>

                      <p>
                        {
                          tasks.filter(
                            (task) =>
                              ![
                                "completed",
                                "cancelled",
                              ].includes(
                                normalize(task.status),
                              ),
                          ).length
                        }{" "}
                        open · {tasks.length} total
                      </p>
                    </div>
                  </div>

                  <button
                    className="os-icon-button"
                    onClick={() => {
                      setEditing(null);
                      setForm({
                        ...blankForm,
                        assigned_name: owner,
                      });
                      setModalOpen(true);
                    }}
                    aria-label={`Add task for ${owner}`}
                  >
                    <Plus />
                  </button>
                </div>

                <div className="os-card-body team-task-list">
                  {tasks.map((task) => {
                    const isOverdue =
                      Boolean(task.due_at) &&
                      new Date(task.due_at as string) <
                        new Date() &&
                      ![
                        "completed",
                        "cancelled",
                      ].includes(
                        normalize(task.status),
                      );

                    const reminderDue =
                      Boolean(task.reminder_at) &&
                      new Date(
                        task.reminder_at as string,
                      ) <= new Date() &&
                      ![
                        "completed",
                        "cancelled",
                      ].includes(
                        normalize(task.status),
                      );

                    return (
                      <article
                        className={`team-task-card ${
                          isOverdue ? "overdue" : ""
                        }`}
                        key={task.id}
                      >
                        <div className="team-task-head">
                          <button
                            className="task-check"
                            onClick={() =>
                              void updateStatus(
                                task,
                                normalize(task.status) ===
                                  "completed"
                                  ? "To Do"
                                  : "Completed",
                              )
                            }
                            aria-label="Toggle completed"
                          >
                            {normalize(task.status) ===
                            "completed" ? (
                              <CheckCircle2 />
                            ) : (
                              <Circle />
                            )}
                          </button>

                          <div>
                            <div className="task-list-label">
                              {task.list_name ||
                                "General"}
                            </div>

                            <strong>{task.title}</strong>

                            {task.description && (
                              <p>{task.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="team-task-meta">
                          <span
                            className={`os-badge ${
                              task.priority ===
                              "Urgent"
                                ? "pink"
                                : task.priority ===
                                    "High"
                                  ? "amber"
                                  : "blue"
                            }`}
                          >
                            {task.priority}
                          </span>

                          <span
                            className={
                              isOverdue
                                ? "task-due overdue"
                                : "task-due"
                            }
                          >
                            <CalendarDays />
                            {dueLabel(task.due_at)}
                          </span>

                          {task.reminder_at && (
                            <span
                              className={
                                reminderDue
                                  ? "task-reminder due"
                                  : "task-reminder"
                              }
                            >
                              <Bell />
                              {reminderLabel(
                                task.reminder_at,
                              )}
                            </span>
                          )}

                          {task.recurring_rule &&
                            task.recurring_rule !==
                              "None" && (
                              <span>
                                <RefreshCw />
                                {task.recurring_rule}
                              </span>
                            )}

                          {task.module && (
                            <span>
                              <ListTodo />
                              {task.module}
                            </span>
                          )}
                        </div>

                        {task.labels?.length ? (
                          <div className="task-labels">
                            {task.labels.map(
                              (label) => (
                                <span key={label}>
                                  {label}
                                </span>
                              ),
                            )}
                          </div>
                        ) : null}

                        <div className="team-task-actions">
                          <select
                            value={task.status}
                            onChange={(event) =>
                              void updateStatus(
                                task,
                                event.target.value,
                              )
                            }
                          >
                            {statusOptions.map(
                              (status) => (
                                <option key={status}>
                                  {status}
                                </option>
                              ),
                            )}
                          </select>

                          <button
                            onClick={() =>
                              openEdit(task)
                            }
                            aria-label="Edit task"
                          >
                            <Edit3 />
                          </button>

                          <button
                            onClick={() =>
                              void remove(task)
                            }
                            aria-label="Delete task"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="os-card">
            <div className="os-card-body">
              <div className="os-empty">
                <div className="os-empty-icon">
                  <ListTodo />
                </div>

                <h3>No tasks in this view</h3>

                <p>
                  Add the first real task or switch the
                  task view. Nothing is pre-filled with
                  dummy work.
                </p>

                <button
                  className="os-btn primary"
                  onClick={openCreate}
                >
                  <Plus />
                  Add Task
                </button>
              </div>
            </div>
          </section>
        )}

        {modalOpen && (
          <div
            className="os-modal-backdrop"
            onMouseDown={() => setModalOpen(false)}
          >
            <section
              className="os-modal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="os-modal-header">
                <div>
                  <h2>
                    {editing
                      ? "Edit Task"
                      : "Add Team Task"}
                  </h2>

                  <p className="os-page-subtitle">
                    Assign work, reminders, recurrence
                    and workflow status.
                  </p>
                </div>

                <button
                  className="os-icon-button"
                  onClick={() =>
                    setModalOpen(false)
                  }
                  aria-label="Close task form"
                >
                  <X />
                </button>
              </div>

              <div className="os-modal-body">
                <div className="os-form-grid">
                  <label className="os-label full">
                    <span>Task Title *</span>

                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="os-label full">
                    <span>Description</span>

                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description:
                            event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="os-label">
                    <span>Assigned Person *</span>

                    <input
                      value={form.assigned_name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          assigned_name:
                            event.target.value,
                        }))
                      }
                      placeholder="e.g. Hamza"
                    />
                  </label>

                  <label className="os-label">
                    <span>List / Section</span>

                    <input
                      value={form.list_name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          list_name:
                            event.target.value,
                        }))
                      }
                      placeholder="Content, Sales, Website…"
                    />
                  </label>

                  <label className="os-label">
                    <span>Due Date & Time</span>

                    <input
                      type="datetime-local"
                      value={form.due_at}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          due_at: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="os-label">
                    <span>Reminder Date & Time</span>

                    <input
                      type="datetime-local"
                      value={form.reminder_at}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          reminder_at:
                            event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className="os-label">
                    <span>Status</span>

                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="os-label">
                    <span>Priority</span>

                    <select
                      value={form.priority}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          priority:
                            event.target.value,
                        }))
                      }
                    >
                      {priorityOptions.map(
                        (priority) => (
                          <option key={priority}>
                            {priority}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="os-label">
                    <span>Repeat</span>

                    <select
                      value={form.recurring_rule}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          recurring_rule:
                            event.target.value,
                        }))
                      }
                    >
                      {recurrenceOptions.map(
                        (rule) => (
                          <option key={rule}>
                            {rule}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="os-label">
                    <span>Labels</span>

                    <input
                      value={form.labels}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          labels: event.target.value,
                        }))
                      }
                      placeholder="urgent, blog, client"
                    />
                  </label>

                  <label className="os-label full">
                    <span>Related Module</span>

                    <input
                      value={form.module}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          module: event.target.value,
                        }))
                      }
                      placeholder="Blog, Social Media, Client Follow-Up…"
                    />
                  </label>
                </div>

                {error && (
                  <p className="os-form-error">
                    {error}
                  </p>
                )}
              </div>

              <div className="os-modal-footer">
                <button
                  className="os-btn soft"
                  onClick={() =>
                    setModalOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="os-btn primary"
                  onClick={() => void save()}
                  disabled={saving}
                >
                  {saving ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    <CheckCircle2 />
                  )}

                  {saving
                    ? "Saving…"
                    : "Save Task"}
                </button>
              </div>
            </section>
          </div>
        )}

        {toast && (
          <div className="os-toast-stack">
            <div className="os-toast">
              <span className="os-toast-icon">
                <BellRing />
              </span>

              <div>
                <strong>{toast}</strong>
                <span>
                  Task reminders and records are stored in
                  Supabase.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function TeamTasksPageLoading() {
  return (
    <AdminShell>
      <div className="os-page clickup-task-page">
        <header className="os-page-header">
          <div>
            <div className="os-page-eyebrow">
              Daily team execution
            </div>

            <h1 className="os-page-title">
              Team Tasks
            </h1>

            <p className="os-page-subtitle">
              Loading team tasks and reminders…
            </p>
          </div>
        </header>

        <section className="os-summary-four compact-summary">
          {[0, 1, 2, 3].map((item) => (
            <article
              className="os-summary-card"
              key={item}
            >
              <div
                className="os-skeleton"
                style={{ height: 54 }}
              />
            </article>
          ))}
        </section>

        <section className="os-card">
          <div className="os-card-body">
            <div
              className="os-skeleton"
              style={{ height: 320 }}
            />
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

export default function TeamTasksPage() {
  return (
    <Suspense fallback={<TeamTasksPageLoading />}>
      <TeamTasksPageContent />
    </Suspense>
  );
}