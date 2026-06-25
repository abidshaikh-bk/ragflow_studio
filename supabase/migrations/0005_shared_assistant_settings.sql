create table if not exists public.agent_runtime_settings (
  singleton_key text primary key default 'global',
  system_prompt text default '' not null,
  enable_vector_search boolean default true not null,
  enable_date_time boolean default true not null,
  enable_web_search boolean default true not null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint agent_runtime_settings_singleton_check
    check (singleton_key = 'global')
);

insert into public.agent_runtime_settings (singleton_key)
values ('global')
on conflict (singleton_key) do nothing;

drop trigger if exists set_agent_runtime_settings_updated_at on public.agent_runtime_settings;
create trigger set_agent_runtime_settings_updated_at
before update on public.agent_runtime_settings
for each row
execute function public.set_updated_at();

alter table public.agent_runtime_settings enable row level security;

grant select, insert, update on public.agent_runtime_settings to authenticated, service_role;

drop policy if exists "Admins can read shared assistant settings" on public.agent_runtime_settings;
create policy "Admins can read shared assistant settings"
  on public.agent_runtime_settings for select
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can insert shared assistant settings" on public.agent_runtime_settings;
create policy "Admins can insert shared assistant settings"
  on public.agent_runtime_settings for insert
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins can update shared assistant settings" on public.agent_runtime_settings;
create policy "Admins can update shared assistant settings"
  on public.agent_runtime_settings for update
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );
