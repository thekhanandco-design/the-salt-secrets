-- Meta / Facebook / Instagram OAuth connection support.
-- OAuth tokens are encrypted by the server before storage and are never readable by browser roles.

create table if not exists public.integration_oauth_tokens (
  provider text primary key,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  token_type text,
  scope text,
  expires_at timestamptz,
  account_id text,
  account_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integration_oauth_tokens enable row level security;
revoke all on table public.integration_oauth_tokens from anon, authenticated;

comment on table public.integration_oauth_tokens is
  'Server-only encrypted OAuth credentials for external integrations.';

insert into public.integration_connections(
  provider,
  label,
  category,
  status,
  config_hint,
  updated_at
)
values (
  'meta',
  'Meta / Facebook / Instagram',
  'Social Media',
  'not_connected',
  '{"required":["META_APP_ID","META_APP_SECRET","META_REDIRECT_URI","META_LOGIN_CONFIG_ID","INTEGRATION_TOKEN_ENCRYPTION_KEY"]}'::jsonb,
  now()
)
on conflict(provider) do update
set
  label = excluded.label,
  category = excluded.category,
  updated_at = now();
