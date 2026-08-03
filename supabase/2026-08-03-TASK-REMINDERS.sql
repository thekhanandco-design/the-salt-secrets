-- The Salt Origin CMS: ClickUp-style task reminders update
-- Safe to run on the existing CMS database.

alter table if exists public.team_tasks add column if not exists list_name text not null default 'General';
alter table if exists public.team_tasks add column if not exists reminder_at timestamptz;
alter table if exists public.team_tasks add column if not exists reminder_sent_at timestamptz;
alter table if exists public.team_tasks add column if not exists recurring_rule text not null default 'None';
alter table if exists public.team_tasks add column if not exists labels text[] not null default '{}';

create index if not exists idx_team_tasks_reminder_at on public.team_tasks(reminder_at);
create index if not exists idx_team_tasks_list_name on public.team_tasks(list_name);
create index if not exists idx_team_tasks_assigned_name on public.team_tasks(assigned_name);
create index if not exists idx_team_tasks_due_at on public.team_tasks(due_at);
create index if not exists idx_team_tasks_status on public.team_tasks(status);
