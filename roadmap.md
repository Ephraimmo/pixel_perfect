# Pixora Roadmap

Implements the 24-screen Pixora mockup with local demo data (no backend).

## Public
- [x] `/` landing, `/signup`, `/login` (+ `/features`, `/pricing`, `/templates` from the nav)
- [x] `/g/:id` client gallery (favorites, lightbox, password gate) and `/g/:id/downloads`
- [x] `/client-portal`
- [x] `/shop` storefront, `/shop/:productId`, `/shop/cart`, `/shop/checkout`, `/shop/order/:orderId` (bank transfer only; card/PayPal are integration points, never charged)

## Studio app (sidebar shell)
- [x] `/dashboard`
- [x] `/galleries`, `/galleries/:id`, `/galleries/:id/upload`, `/galleries/:id/settings`
- [x] `/clients`
- [x] `/studio` sessions, `/studio/calendar` (month / week / day)
- [x] `/website` templates
- [x] `/store` overview, `/store/products` (+ `/new`, `/:id`, `/:id/edit`), `/store/orders` (+ `/:id`), `/store/coupons`, `/store/reports`, `/store/settings`
- [x] `/editor` photo editor
- [x] `/mobile-apps`, `/team` (team & integrations), `/settings`

Demo state lives in `src/lib/store.tsx` (persisted to localStorage, reset from the profile menu);
seed data and Unsplash photo ids are in `src/lib/demo-data.ts`. Store/commerce state is separate:
`src/lib/shop.tsx` (key `pixora-shop-v1`, seed + migrations in `src/lib/shop-data.ts`) and the client cart in
`src/lib/shop-cart-context.tsx` (key `pixora-cart-v1`).
