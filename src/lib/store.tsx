// Pixora demo store — React context over local state, persisted to
// localStorage. There is no backend: every action below operates on demo
// state and is honest about it in the UI.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PHOTOS,
  STATE_VERSION,
  seedState,
  type Client,
  type DemoState,
  type Gallery,
  type Order,
  type Product,
  type Profile,
  type Session,
  type TeamMember,
} from "./demo-data";

const STORAGE_KEY = "pixora-demo-v2";

function loadState(): DemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed.version !== STATE_VERSION || !Array.isArray(parsed.galleries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export interface DemoStore {
  state: DemoState;
  resetDemo: () => void;
  updateProfile: (patch: Partial<Profile>) => void;
  createGallery: (title: string) => Gallery;
  updateGallery: (id: string, patch: Partial<Gallery>) => void;
  addPhotos: (id: string, count: number) => void;
  toggleFavorite: (galleryId: string, photoId: string) => void;
  addClient: (input: { name: string; email: string }) => void;
  toggleClientStar: (id: string) => void;
  addSession: (input: Omit<Session, "id" | "color" | "status">) => void;
  updateSessionStatus: (id: string, status: Session["status"]) => void;
  addProduct: (input: Pick<Product, "name" | "category" | "price">) => void;
  toggleProduct: (id: string) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  inviteMember: (input: { name: string; email: string; role: TeamMember["role"] }) => void;
  toggleIntegration: (id: string) => void;
  publishTemplate: (id: string) => void;
}

const DemoContext = createContext<DemoStore | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => seedState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadState();
    if (saved) setState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable — demo state simply won't persist
    }
  }, [state, ready]);

  const value = useMemo<DemoStore>(() => {
    const patchList = <
      K extends "galleries" | "clients" | "sessions" | "products" | "orders" | "integrations",
    >(
      key: K,
      id: string,
      patch: (item: DemoState[K][number]) => Partial<DemoState[K][number]>,
    ) =>
      setState((s) => ({
        ...s,
        [key]: (s[key] as DemoState[K][number][]).map((item) =>
          item.id === id ? { ...item, ...patch(item) } : item,
        ),
      }));

    return {
      state,
      resetDemo: () => setState(seedState()),
      updateProfile: (patch) => setState((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
      createGallery: (title) => {
        const gallery: Gallery = {
          id: uid("g"),
          title,
          shortTitle: title,
          description: "",
          status: "draft",
          date: new Date().toISOString().slice(0, 10),
          updated: "Just now",
          photoCount: 0,
          cover: PHOTOS.lakeBanner,
          banner: PHOTOS.lakeBanner,
          photos: [],
          favorites: [],
          privacy: "public",
          password: "",
          allowDownloads: true,
          allowFavorites: true,
        };
        setState((s) => ({ ...s, galleries: [gallery, ...s.galleries] }));
        return gallery;
      },
      updateGallery: (id, patch) =>
        patchList("galleries", id, () => ({ ...patch, updated: "Just now" })),
      addPhotos: (id, count) =>
        patchList("galleries", id, (g) => {
          // Demo upload: borrow wedding frames that aren't in the gallery yet.
          const extra = PHOTOS.wedding.filter((p) => !g.photos.includes(p)).slice(0, count);
          const photos = [...g.photos, ...extra];
          return {
            photos,
            photoCount: g.photoCount + count,
            cover: g.photos.length ? g.cover : (photos[0] ?? g.cover),
            updated: "Just now",
          };
        }),
      toggleFavorite: (galleryId, photoId) =>
        patchList("galleries", galleryId, (g) => ({
          favorites: g.favorites.includes(photoId)
            ? g.favorites.filter((p) => p !== photoId)
            : [...g.favorites, photoId],
        })),
      addClient: ({ name, email }) =>
        setState((s) => ({
          ...s,
          clients: [
            {
              id: uid("c"),
              name,
              email,
              avatar: PHOTOS.avatars.olivia,
              sessions: 0,
              starred: false,
            } satisfies Client,
            ...s.clients,
          ],
        })),
      toggleClientStar: (id) => patchList("clients", id, (c) => ({ starred: !c.starred })),
      addSession: (input) =>
        setState((s) => ({
          ...s,
          sessions: [...s.sessions, { ...input, id: uid("s"), status: "pending", color: "violet" }],
          clients: s.clients.map((c) =>
            c.id === input.clientId ? { ...c, sessions: c.sessions + 1 } : c,
          ),
        })),
      updateSessionStatus: (id, status) => patchList("sessions", id, () => ({ status })),
      addProduct: (input) =>
        setState((s) => ({
          ...s,
          products: [
            ...s.products,
            { ...input, id: uid("p"), popular: false, image: PHOTOS.wedding[5], active: true },
          ],
        })),
      toggleProduct: (id) => patchList("products", id, (p) => ({ active: !p.active })),
      updateOrderStatus: (id, status) => patchList("orders", id, () => ({ status })),
      inviteMember: ({ name, email, role }) =>
        setState((s) => ({
          ...s,
          team: [
            ...s.team,
            { id: uid("t"), name, email, role, status: "pending", avatar: PHOTOS.avatars.sarah },
          ],
        })),
      toggleIntegration: (id) =>
        patchList("integrations", id, (i) => ({ connected: !i.connected })),
      publishTemplate: (id) => setState((s) => ({ ...s, publishedTemplate: id })),
    };
  }, [state]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoStore {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
