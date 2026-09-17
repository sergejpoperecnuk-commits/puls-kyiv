alter table ingest_state
  add column if not exists seed_version integer not null default 0;
