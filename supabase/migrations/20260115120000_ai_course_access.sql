-- AI course generation access + payments
create table if not exists public.ai_course_access (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  granted_until timestamptz null,
  granted_by_admin boolean not null default false,
  granted_by uuid null,
  last_payment_intent_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ai_course_access_usuario_id_key
  on public.ai_course_access (usuario_id);

alter table public.ai_course_access enable row level security;

create policy "Usuarios podem ver seu acesso IA"
  on public.ai_course_access
  for select
  using (auth.uid() = usuario_id);

create policy "Admins podem ver acesso IA"
  on public.ai_course_access
  for select
  using (exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  ));

create policy "Admins podem gerenciar acesso IA"
  on public.ai_course_access
  for insert
  with check (exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  ));

create policy "Admins podem atualizar acesso IA"
  on public.ai_course_access
  for update
  using (exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  ));

create policy "Admins podem revogar acesso IA"
  on public.ai_course_access
  for delete
  using (exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  ));

create table if not exists public.ai_course_payments (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  valor numeric not null,
  status text not null,
  stripe_payment_intent_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_course_payments enable row level security;

create policy "Usuarios podem ver seus pagamentos IA"
  on public.ai_course_payments
  for select
  using (auth.uid() = usuario_id);

create policy "Admins podem ver pagamentos IA"
  on public.ai_course_payments
  for select
  using (exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  ));
