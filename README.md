# Пульс Києва

Цивільний агрегатор відкритих Telegram-повідомлень Києва та Київської області.
Стрічка оновлюється наживо, історія зберігається в PostgreSQL.

Застосунок **не** визначає координат, траєкторій і не прогнозує переміщення військових цілей.

## Що вміє

- Live-стрічка без перезавантаження (SSE)
- Картки: джерело, час, текст, медіа, посилання в Telegram
- Фільтр за джерелами та темами
- Пошук і історія
- PWA / екран «Домівка» на iPhone
- Allowlist цивільних каналів (влада, комунальні, транспорт, погода, ДСНС)

## Архітектура

```
Telegram (t.me/s/… або Bot API webhook)
        │
        ▼
  Ingest (Node / TanStack Start)
        │
        ▼
  PostgreSQL  ── SSE /api/stream ── React (наживо)
        │
        └── REST /api/messages|sources|stats
```

Повноцінний вебзастосунок на React + TypeScript. Бекенд — серверні маршрути
TanStack Start (еквівалент FastAPI: REST, стрім, інгест, Postgres).

### Дані

| Таблиця | Призначення |
|---|---|
| `sources` | Дозволені канали |
| `messages` | Збережені повідомлення |
| `ingest_state` | Стан скрейпера / live-індекс |

Інгест приймає лише username з allowlist (`src/lib/pulse/sources.ts`).

### Realtime

`GET /api/stream` — Server-Sent Events (`hello`, `message`, `ping`).
Клієнт тримає `EventSource` і вставляє нові картки зверху. Якщо канал падає —
періодичне оновлення стрічки.

### REST

| Метод | Шлях | Опис |
|---|---|---|
| GET | `/api/messages?q=&source=&category=&cursor=&limit=` | Стрічка / історія |
| GET | `/api/sources` | Джерела зі статистикою |
| GET | `/api/stats` | Сьогодні, 24 год, активність |
| GET | `/api/stream` | SSE live |
| POST | `/api/telegram` | Telegram Bot API webhook |
| GET | `/api/telegram` | Перевірка webhook |

Webhook приймає `channel_post` / `message`. Якщо задано
`TELEGRAM_WEBHOOK_SECRET`, перевіряється заголовок
`X-Telegram-Bot-Api-Secret-Token`.

Публічні сторінки каналів (`https://t.me/s/{username}`) періодично зчитуються
як запасний канал. Якщо Telegram недоступний, працює резервна цивільна стрічка,
щоб live-режим був видимий.

## Стек

- Frontend: React 19, TypeScript, TanStack Router / Query, Tailwind v4
- Backend: TanStack Start server routes, PostgreSQL (Neon у проді, PGLite у прев’ю)
- Realtime: SSE
- Telegram: публічні сторінки каналів + Bot API webhook

## Запуск для розробки

```bash
npm install
npm run dev          # http://0.0.0.0:8080
npm run typecheck
npm run build
```

Міграції: `migrations/0002_kyiv_pulse.sql`, `migrations/0003_seed_version.sql`.
Не створюйте `.env` — `DATABASE_URL` підставляється при деплої.

## Підключити живий Telegram

1. Створіть бота в BotFather, додайте його адміністратором у дозволені канали.
2. Виставте webhook: `https://<host>/api/telegram`.
3. За бажанням задайте `TELEGRAM_WEBHOOK_SECRET`.

Повідомлення з каналів поза allowlist відхиляються.
