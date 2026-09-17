-- Civic Telegram aggregator for Kyiv and Kyiv Oblast.
-- Unowned rows (no user_id): world-readable monitoring feed.

create table if not exists sources (
  id           text primary key,
  username     text not null unique,
  title        text not null,
  description  text not null,
  category     text not null,
  region       text not null default 'kyiv',
  initials     text not null,
  enabled      boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists messages (
  id            text primary key,
  source_id     text not null references sources(id),
  telegram_id   text not null,
  body          text not null,
  published_at  timestamptz not null,
  telegram_url  text not null,
  media_url     text,
  media_type    text not null default 'none',
  category      text not null,
  ingested_at   timestamptz not null default now(),
  unique (source_id, telegram_id)
);

create index if not exists messages_published_idx on messages (published_at desc, id desc);
create index if not exists messages_source_idx on messages (source_id, published_at desc);
create index if not exists messages_category_idx on messages (category, published_at desc);

create table if not exists ingest_state (
  id              text primary key default 'default',
  last_ingest_at  timestamptz,
  last_live_at    timestamptz,
  live_index      integer not null default 0,
  scraper_ok      boolean not null default false
);
