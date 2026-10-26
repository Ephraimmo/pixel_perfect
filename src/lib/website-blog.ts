// Website blog — post types, seed posts, list filtering and a tiny markup
// parser for post bodies (headings, quotes, lists, images, bold/italic/links).

import { PHOTOS } from "./demo-data";
import { slugify, uid } from "./website-pages";

export type PostStatus = "draft" | "published";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  /** Unsplash photo id, or "" for none. */
  cover: string;
  body: string;
  status: PostStatus;
  /** Publish date shown on the post (ISO date). */
  date: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  updatedAt: string; // ISO timestamp
}

const W = PHOTOS.wedding;
const F = PHOTOS.family;
const T = PHOTOS.travel;

export function seedPosts(): BlogPost[] {
  const post = (p: Omit<BlogPost, "seoTitle" | "seoDescription" | "updatedAt">): BlogPost => ({
    ...p,
    seoTitle: "",
    seoDescription: "",
    updatedAt: `${p.date}T09:00:00.000Z`,
  });
  return [
    post({
      id: "post-lakeside-wedding",
      title: "Sarah & James: a lakeside wedding",
      slug: "sarah-james-lakeside-wedding",
      excerpt: "Mist on the water, a string quartet and the happiest rain shower of the season.",
      cover: W[0],
      status: "published",
      date: "2025-04-14",
      tags: ["wedding", "lakeside"],
      body: [
        "Sarah and James planned every detail of their day — except the weather. When a light rain rolled in during the vows, nobody moved.",
        "## Getting ready",
        "We started at the cottage with coffee, laughter and a **very** nervous best man.",
        `![The first look by the jetty](${W[1]})`,
        "> “We forgot it was raining. We only remember how it felt.” — Sarah",
        "## Favourite moments",
        "- The first look on the jetty\n- Grandma's surprise speech\n- Sparklers under the umbrellas",
        "See the full story in [the gallery](https://karabo.pixora.site/portfolio).",
      ].join("\n\n"),
    }),
    post({
      id: "post-what-to-wear",
      title: "What to wear to your family session",
      slug: "what-to-wear-family-session",
      excerpt:
        "Simple, *timeless* outfit ideas that photograph beautifully — no matching required.",
      cover: F[0],
      status: "published",
      date: "2025-03-30",
      tags: ["family", "tips"],
      body: [
        "The most common question I get before a family session is what to wear. Here's my short answer: **comfort first**, then colour.",
        "## Coordinate, don't match",
        "Pick two or three colours that sit well together and let everyone choose within them.",
        "- Soft neutrals with one accent colour\n- Textures like knit, linen and denim\n- Avoid big logos and neon",
        `![Autumn colours at the park](${F[2]})`,
        "## Bring a backup",
        "Little ones get messy. A spare top saves the day more often than you'd think.",
      ].join("\n\n"),
    }),
    post({
      id: "post-golden-hour",
      title: "Behind the lens: golden hour on the coast",
      slug: "golden-hour-on-the-coast",
      excerpt:
        "How I plan sunset shoots, and why the best light arrives after you think it's gone.",
      cover: T[2],
      status: "draft",
      date: "2025-04-20",
      tags: ["behind the scenes"],
      body: [
        "Golden hour is short, so planning matters.",
        "## Check the horizon",
        "Clouds on the horizon can steal the last ten minutes of light — or make them spectacular.",
      ].join("\n\n"),
    }),
  ];
}

export function newPost(posts: BlogPost[], today: string): BlogPost {
  return {
    id: uid("post"),
    title: "Untitled post",
    slug: uniquePostSlug(posts, "untitled-post"),
    excerpt: "",
    cover: "",
    body: "",
    status: "draft",
    date: today,
    tags: [],
    seoTitle: "",
    seoDescription: "",
    updatedAt: new Date().toISOString(),
  };
}

export function uniquePostSlug(posts: BlogPost[], base: string, exceptId?: string): string {
  const root = slugify(base) || "post";
  const taken = new Set(posts.filter((p) => p.id !== exceptId).map((p) => p.slug));
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

export type PostFilter = "all" | PostStatus;

export function filterPosts(posts: BlogPost[], filter: PostFilter, query: string): BlogPost[] {
  const q = query.trim().toLowerCase();
  return posts
    .filter((p) => filter === "all" || p.status === filter)
    .filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
}

/** Published posts, newest first — what the public blog lists. */
export function publishedPosts(posts: BlogPost[]): BlogPost[] {
  return filterPosts(posts, "published", "");
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /\w/.test(w)).length;
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 200));
}

export function formatPostDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------- body markup ----------

export type Block =
  | { type: "p"; text: string }
  | { type: "h2" | "h3"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; photo: string; caption: string };

/** Split a post body into blocks. Blocks are separated by blank lines. */
export function parseBody(body: string): Block[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(chunk);
      if (image) return { type: "image", caption: image[1] ?? "", photo: image[2] ?? "" };
      if (chunk.startsWith("### ")) return { type: "h3", text: chunk.slice(4).trim() };
      if (chunk.startsWith("## ")) return { type: "h2", text: chunk.slice(3).trim() };
      const lines = chunk.split("\n");
      if (lines.every((l) => l.startsWith("> "))) {
        return { type: "quote", text: lines.map((l) => l.slice(2)).join(" ") };
      }
      if (lines.every((l) => /^[-*] /.test(l))) {
        return { type: "list", items: lines.map((l) => l.slice(2).trim()) };
      }
      return { type: "p", text: lines.join(" ") };
    });
}

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold" | "italic"; text: string }
  | { type: "link"; text: string; href: string };

/** Inline **bold**, *italic* and [links](https://…). Anything else is plain text. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: "bold", text: m[1] });
    else if (m[2] !== undefined) out.push({ type: "italic", text: m[2] });
    else out.push({ type: "link", text: m[3] ?? "", href: m[4] ?? "" });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}

/** Plain text of inline markup (for excerpts and SEO fallbacks). */
export function plainText(text: string): string {
  return parseInline(text)
    .map((p) => p.text)
    .join("");
}

// ---------- editor formatting ----------

export type Format = "h2" | "h3" | "bold" | "italic" | "quote" | "list" | "link";

export interface Edit {
  text: string;
  selStart: number;
  selEnd: number;
}

/** Apply a toolbar format to the selected text (or a placeholder) and return the new selection. */
export function applyFormat(text: string, selStart: number, selEnd: number, format: Format): Edit {
  const selected = text.slice(selStart, selEnd);
  const before = text.slice(0, selStart);
  const after = text.slice(selEnd);

  const wrap = (open: string, close: string, placeholder: string): Edit => {
    const inner = selected || placeholder;
    return {
      text: `${before}${open}${inner}${close}${after}`,
      selStart: selStart + open.length,
      selEnd: selStart + open.length + inner.length,
    };
  };

  // Block formats start their own paragraph and prefix every selected line.
  const block = (prefix: string, placeholder: string): Edit => {
    const lines = (selected || placeholder)
      .split("\n")
      .map((l) => `${prefix}${l.replace(/^(#{2,3} |> |[-*] )/, "")}`);
    const lead =
      before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
    const tail =
      after === "" || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
    const inserted = lines.join("\n");
    const start = before.length + lead.length;
    return {
      text: `${before}${lead}${inserted}${tail}${after}`,
      selStart: start,
      selEnd: start + inserted.length,
    };
  };

  switch (format) {
    case "bold":
      return wrap("**", "**", "bold text");
    case "italic":
      return wrap("*", "*", "italic text");
    case "link": {
      const label = selected || "link text";
      const href = "https://";
      const out = `${before}[${label}](${href})${after}`;
      const hrefStart = selStart + label.length + 3;
      return { text: out, selStart: hrefStart, selEnd: hrefStart + href.length };
    }
    case "h2":
      return block("## ", "Heading");
    case "h3":
      return block("### ", "Subheading");
    case "quote":
      return block("> ", "Quote");
    case "list":
      return block("- ", "List item");
  }
}

/** Insert an image block at the cursor, on its own paragraph. */
export function insertImage(text: string, at: number, photo: string, caption = ""): Edit {
  const before = text.slice(0, at);
  const after = text.slice(at);
  const lead =
    before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const tail = after === "" || after.startsWith("\n\n") ? "" : "\n\n";
  const block = `![${caption}](${photo})`;
  const end = before.length + lead.length + block.length;
  return { text: `${before}${lead}${block}${tail}${after}`, selStart: end, selEnd: end };
}
