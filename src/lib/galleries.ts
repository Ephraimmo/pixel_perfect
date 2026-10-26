// Gallery list helpers — URL search validation plus filter/search/sort, kept
// pure so the list page and its tests share one implementation.

import type { Gallery, GalleryStatus } from "./demo-data";

export type GalleryStatusFilter = "all" | GalleryStatus;
export type GallerySort = "newest" | "oldest" | "name" | "photos";

export const GALLERY_STATUS_TABS: { value: GalleryStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "archived", label: "Archived" },
];

export const GALLERY_SORT_LABELS: Record<GallerySort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name A–Z",
  photos: "Most photos",
};

export const GALLERY_TITLE_MAX = 80;

export interface GalleryListSearch {
  status?: GalleryStatusFilter;
  q?: string;
  sort?: GallerySort;
}

const isStatus = (v: unknown): v is GalleryStatusFilter =>
  GALLERY_STATUS_TABS.some((t) => t.value === v);
const isSort = (v: unknown): v is GallerySort =>
  typeof v === "string" && v in GALLERY_SORT_LABELS;

/** Parse ?status=&q=&sort= leniently: unknown values fall back to defaults (omitted). */
export function validateGalleryListSearch(raw: Record<string, unknown>): GalleryListSearch {
  const out: GalleryListSearch = {};
  if (isStatus(raw.status) && raw.status !== "all") out.status = raw.status;
  if (typeof raw.q === "string" && raw.q.trim()) out.q = raw.q;
  if (isSort(raw.sort) && raw.sort !== "newest") out.sort = raw.sort;
  return out;
}

export function countByStatus(galleries: Gallery[]): Record<GalleryStatusFilter, number> {
  const counts: Record<GalleryStatusFilter, number> = { all: galleries.length, published: 0, draft: 0, archived: 0 };
  for (const g of galleries) counts[g.status] += 1;
  return counts;
}

/** Case-insensitive match on title and description. */
export function matchesQuery(g: Gallery, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
}

export function filterGalleries(
  galleries: Gallery[],
  { status = "all", q = "", sort = "newest" }: GalleryListSearch,
): Gallery[] {
  const byDateDesc = (a: Gallery, b: Gallery) => b.date.localeCompare(a.date);
  const compare: Record<GallerySort, (a: Gallery, b: Gallery) => number> = {
    newest: byDateDesc,
    oldest: (a, b) => a.date.localeCompare(b.date),
    name: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    photos: (a, b) => b.photoCount - a.photoCount || byDateDesc(a, b),
  };
  return galleries
    .filter((g) => status === "all" || g.status === status)
    .filter((g) => matchesQuery(g, q))
    .sort(compare[sort]);
}
