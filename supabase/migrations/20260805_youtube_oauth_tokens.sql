-- Secure OAuth token storage for CMS integrations.
-- Tokens are encrypted by the server before insertion.

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

-- OAuth credentials must never be readable from the browser.
revoke all on table public.integration_oauth_tokens from anon, authenticated;

comment on table public.integration_oauth_tokens is
  'Server-only encrypted OAuth credentials for external integrations.';
