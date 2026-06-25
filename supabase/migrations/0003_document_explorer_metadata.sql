alter table public.documents
  add column if not exists chunking_strategy_snapshot jsonb default '{}'::jsonb not null;

alter table public.documents
  add column if not exists indexing_snapshot jsonb default '{}'::jsonb not null;
