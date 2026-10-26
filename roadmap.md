# Pixora Roadmap

Implements the 24-screen Pixora mockup with local demo data (no backend).

## Public
- [x] `/` landing, `/signup`, `/login` (+ `/features`, `/pricing`, `/templates` from the nav)
- [x] `/g/:id` client gallery (favorites, lightbox, password gate) and `/g/:id/downloads`
- [x] `/client-portal`

## Studio app (sidebar shell)
- [x] `/dashboard`
- [x] `/galleries`, `/galleries/:id`, `/galleries/:id/upload`, `/galleries/:id/settings`
- [x] `/clients`
- [x] `/studio` sessions, `/studio/calendar` (month / week / day)
- [x] `/website` templates
- [x] `/store` products, `/store/orders`
- [x] `/editor` photo editor
- [x] `/mobile-apps`, `/team` (team & integrations), `/settings`

Demo state lives in `src/lib/store.tsx` (persisted to localStorage, reset from the profile menu);
seed data and Unsplash photo ids are in `src/lib/demo-data.ts`.
