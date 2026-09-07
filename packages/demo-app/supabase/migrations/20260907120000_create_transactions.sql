-- TrustMesh user-owned transaction association (Supabase Auth)
-- Blockchain remains source of truth; this table only links activity to auth.users.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wallet_address text,
  tx_hash text not null,
  status text,
  agent_address text,
  created_at timestamptz not null default now(),
  constraint transactions_user_tx_unique unique (user_id, tx_hash)
);

create index if not exists transactions_user_id_created_at_idx
  on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;

-- SELECT: own rows only
create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using (user_id = auth.uid());

-- INSERT: own rows only (user_id must equal session)
create policy "transactions_insert_own"
  on public.transactions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- UPDATE: own rows only
create policy "transactions_update_own"
  on public.transactions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE: own rows only
create policy "transactions_delete_own"
  on public.transactions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Deny all for anon (no policies for anon role)
revoke all on table public.transactions from anon;
grant select, insert, update, delete on table public.transactions to authenticated;
grant usage, select on all sequences in schema public to authenticated;
