-- Акции товара (1+1=3 на бюсты, 1+1=3 на трусы и т.п.).
-- Выполнить один раз в Supabase: SQL Editor -> New query -> вставить -> Run.
alter table products add column if not exists promos text[] not null default '{}';
create index if not exists products_promos_idx on products using gin (promos);
