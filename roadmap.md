# Pixora Roadmap

Implements the 24-screen Pixora mockup with local demo data (no backend).

## Public

- [x] `/` landing, `/signup`, `/login` (+ `/features`, `/pricing`, `/templates` from the nav)
- [x] `/g/:id` client gallery (favorites, lightbox, password gate) and `/g/:id/downloads`
- [x] `/client-portal`
- [x] `/book` booking page (session types, date & time, request lands in Leads)
- [x] `/q/:id` client questionnaire form (save and finish later, submit)
- [x] `/shop` storefront, `/shop/:productId`, `/shop/cart`, `/shop/checkout`, `/shop/order/:orderId` (bank transfer only; card/PayPal are integration points, never charged)

## Studio app (sidebar shell)

- [x] `/dashboard`
- [x] `/galleries`, `/galleries/:id`, `/galleries/:id/upload`, `/galleries/:id/settings`
- [x] `/clients` list, `/clients/:id` profile (contact, notes, projects, sessions, galleries, invoices, activity)
- [x] `/leads` pipeline board & list, inquiry details, stage changes, convert to client
- [x] `/projects`, `/projects/:id` (tasks, linked sessions, galleries, quotes, contracts, invoices)
- [x] `/studio` sessions, `/studio/sessions/:id` (edit, reschedule, cancel), `/studio/calendar` (month / week / day)
- [x] Business: `/quotes` (+ `/new`, `/:id`), `/contracts` (+ `/:id`, `/templates/:id`), `/invoices` (+ `/new`, `/:id`, payments), `/questionnaires` (+ `/:id`, `/templates/:id`, question library)
- [x] Automation: `/emails` (+ `/:id`, sent & scheduled), `/automations` (+ `/:id`, execution history)
- [x] `/website` templates
- [x] `/store` overview, `/store/products` (+ `/new`, `/:id`, `/:id/edit`), `/store/orders` (+ `/:id`), `/store/coupons`, `/store/reports`, `/store/settings`
- [x] `/editor` photo editor
- [x] `/mobile-apps`, `/team` (team & integrations), `/settings`

Demo state lives in `src/lib/store.tsx` (persisted to localStorage, reset from the profile menu);
seed data and Unsplash photo ids are in `src/lib/demo-data.ts`, with CRM seeds in `src/lib/*-data.ts`
(`migrateState` upgrades saved demo data instead of resetting it). Pure helpers with tests live beside them
(`clients.ts`, `leads.ts`, `invoices.ts`, …). "Today" in the demo is `DEMO_TODAY` (Apr 20, 2025). Store/commerce state is separate:
`src/lib/shop.tsx` (key `pixora-shop-v1`, seed + migrations in `src/lib/shop-data.ts`) and the client cart in
`src/lib/shop-cart-context.tsx` (key `pixora-cart-v1`).
