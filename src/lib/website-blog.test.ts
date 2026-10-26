import { describe, expect, it } from "vitest";

import {
  applyFormat,
  filterPosts,
  insertImage,
  newPost,
  parseBody,
  parseInline,
  plainText,
  publishedPosts,
  readingMinutes,
  seedPosts,
  uniquePostSlug,
  wordCount,
} from "@/lib/website-blog";

const titles = (list: { title: string }[]) => list.map((p) => p.title);

describe("posts", () => {
  const posts = seedPosts();

  it("lists published posts newest first", () => {
    expect(titles(publishedPosts(posts))).toEqual([
      "Sarah & James: a lakeside wedding",
      "What to wear to your family session",
    ]);
  });

  it("filters by status and searches title, excerpt and tags", () => {
    expect(titles(filterPosts(posts, "draft", ""))).toEqual([
      "Behind the lens: golden hour on the coast",
    ]);
    expect(titles(filterPosts(posts, "all", "TIPS"))).toEqual([
      "What to wear to your family session",
    ]);
    expect(filterPosts(posts, "published", "golden")).toEqual([]);
  });

  it("creates unique slugs for new posts", () => {
    const a = newPost(posts, "2025-05-01");
    expect(a.status).toBe("draft");
    expect(uniquePostSlug([...posts, a], "untitled-post")).toBe("untitled-post-2");
    expect(uniquePostSlug(posts, "What to wear: family session!")).toBe(
      "what-to-wear-family-session-2",
    );
  });

  it("counts words and reading time", () => {
    expect(wordCount("  one two\n\nthree — ## ")).toBe(3);
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("word ".repeat(1000))).toBe(5);
  });
});

describe("parseBody", () => {
  it("parses headings, quotes, lists, images and paragraphs", () => {
    const body = [
      "Intro line one\nline two",
      "## Heading",
      "### Sub",
      "> Quote a\n> quote b",
      "- one\n- two",
      "![Caption here](abc-123)",
    ].join("\n\n");
    expect(parseBody(body)).toEqual([
      { type: "p", text: "Intro line one line two" },
      { type: "h2", text: "Heading" },
      { type: "h3", text: "Sub" },
      { type: "quote", text: "Quote a quote b" },
      { type: "list", items: ["one", "two"] },
      { type: "image", caption: "Caption here", photo: "abc-123" },
    ]);
  });

  it("ignores blank chunks and Windows line endings", () => {
    expect(parseBody("\r\n\r\nHello\r\n\r\n\r\n")).toEqual([{ type: "p", text: "Hello" }]);
  });
});

describe("parseInline", () => {
  it("parses bold, italic and links", () => {
    expect(parseInline("a **b** *c* [d](https://x.y) e")).toEqual([
      { type: "text", text: "a " },
      { type: "bold", text: "b" },
      { type: "text", text: " " },
      { type: "italic", text: "c" },
      { type: "text", text: " " },
      { type: "link", text: "d", href: "https://x.y" },
      { type: "text", text: " e" },
    ]);
    expect(plainText("Simple, *timeless* ideas")).toBe("Simple, timeless ideas");
  });
});

describe("applyFormat", () => {
  it("wraps the selection in bold and keeps it selected", () => {
    const r = applyFormat("make this bold", 10, 14, "bold");
    expect(r.text).toBe("make this **bold**");
    expect(r.text.slice(r.selStart, r.selEnd)).toBe("bold");
  });

  it("inserts a placeholder when nothing is selected", () => {
    const r = applyFormat("x", 1, 1, "italic");
    expect(r.text).toBe("x*italic text*");
    expect(r.text.slice(r.selStart, r.selEnd)).toBe("italic text");
  });

  it("makes block formats their own paragraph", () => {
    const r = applyFormat("Para one\nTitle", 9, 14, "h2");
    expect(r.text).toBe("Para one\n\n## Title");
    expect(parseBody(r.text).map((b) => b.type)).toEqual(["p", "h2"]);
  });

  it("turns selected lines into a list, replacing other prefixes", () => {
    const r = applyFormat("a\n> b", 0, 5, "list");
    expect(r.text).toBe("- a\n- b");
  });

  it("selects the URL of a new link for typing", () => {
    const r = applyFormat("see site", 4, 8, "link");
    expect(r.text).toBe("see [site](https://)");
    expect(r.text.slice(r.selStart, r.selEnd)).toBe("https://");
  });

  it("inserts images as their own block", () => {
    const r = insertImage("Hello world", 5, "pic");
    expect(parseBody(r.text)).toEqual([
      { type: "p", text: "Hello" },
      { type: "image", caption: "", photo: "pic" },
      { type: "p", text: "world" },
    ]);
  });
});
