import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  Bold,
  Eye,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  Quote,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Panel, StatusBadge, pageHead } from "@/components/kit";
import { Segmented } from "@/components/website";
import { PhotoPickerDialog } from "@/components/website-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useWebsite } from "@/lib/website-store";
import { siteUrl } from "@/lib/website";
import { img } from "@/lib/demo-data";
import {
  applyFormat,
  insertImage,
  plainText,
  readingMinutes,
  uniquePostSlug,
  wordCount,
  type BlogPost,
  type Format,
} from "@/lib/website-blog";
import { slugify } from "@/lib/website-pages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website/blog/$postId/")({
  head: () => pageHead("Edit Post", "Write and edit a blog post for your website."),
  component: PostEditor,
});

const TOOLS: { format: Format; label: string; icon: typeof Bold }[] = [
  { format: "h2", label: "Heading", icon: Heading2 },
  { format: "h3", label: "Subheading", icon: Heading3 },
  { format: "bold", label: "Bold", icon: Bold },
  { format: "italic", label: "Italic", icon: Italic },
  { format: "link", label: "Link", icon: Link2 },
  { format: "quote", label: "Quote", icon: Quote },
  { format: "list", label: "Bulleted list", icon: List },
];

const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;

function PostEditor() {
  const { postId } = Route.useParams();
  const navigate = useNavigate();
  const { site, update } = useWebsite();
  const post = site.posts.find((p) => p.id === postId);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [picking, setPicking] = useState<"cover" | "inline" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [slugDraft, setSlugDraft] = useState<string | null>(null);

  if (!post) {
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          title="Post not found"
          description="It may have been deleted."
          action={
            <Button asChild size="sm">
              <Link to="/website/blog">Back to blog</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const blogPage = site.pages.find((p) => p.sections.some((s) => s.kind === "blog"));
  const postUrl = `${siteUrl(site)}/${blogPage?.slug || "blog"}/${post.slug}`;

  const patch = (p: Partial<BlogPost>) =>
    update((s) => ({
      posts: s.posts.map((x) =>
        x.id === post.id ? { ...x, ...p, updatedAt: new Date().toISOString() } : x,
      ),
    }));

  /** Replace the body and restore the caret/selection after React re-renders. */
  const setBody = (text: string, selStart: number, selEnd: number) => {
    patch({ body: text });
    requestAnimationFrame(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  };

  const format = (f: Format) => {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? post.body.length;
    const end = el?.selectionEnd ?? post.body.length;
    const next = applyFormat(post.body, start, end, f);
    setBody(next.text, next.selStart, next.selEnd);
  };

  const onBodyKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    if (key === "b" || key === "i" || key === "k") {
      e.preventDefault();
      format(key === "b" ? "bold" : key === "i" ? "italic" : "link");
    }
  };

  const addTag = () => {
    const tag = tagDraft.trim().replace(/^#/, "").toLowerCase();
    setTagDraft("");
    if (!tag || post.tags.includes(tag)) return;
    patch({ tags: [...post.tags, tag] });
  };

  const commitSlug = () => {
    if (slugDraft === null) return;
    const next = slugify(slugDraft);
    setSlugDraft(null);
    if (!next) {
      toast.error("The post address can't be empty.");
      return;
    }
    const unique = uniquePostSlug(site.posts, next, post.id);
    if (unique !== next) toast.info(`Address in use — changed to “${unique}”.`);
    patch({ slug: unique });
  };

  const togglePublish = () => {
    const publish = post.status === "draft";
    if (publish && !post.title.trim()) {
      toast.error("Add a title before publishing.");
      return;
    }
    patch({ status: publish ? "published" : "draft" });
    toast.success(publish ? "Post published" : "Post moved to drafts", {
      description: publish ? "It goes live with your next website publish." : undefined,
    });
  };

  const seoTitle = post.seoTitle || post.title || "Untitled post";
  const seoDesc =
    post.seoDescription || plainText(post.excerpt) || plainText(post.body).slice(0, 155);
  const words = wordCount(post.body);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/website/blog"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Blog
      </Link>
      <div className="mt-2 flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="display-title truncate text-2xl">{post.title || "Untitled post"}</h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={post.status} /> Saved as you type
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="bg-card">
            <Link to="/website/blog/$postId/preview" params={{ postId: post.id }}>
              <Eye /> Preview
            </Link>
          </Button>
          <Button size="sm" onClick={togglePublish}>
            {post.status === "draft" ? "Publish post" : "Unpublish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Panel className="space-y-4 p-4 sm:p-5">
          <div className="space-y-1.5">
            <Label htmlFor="post-title" className="text-xs">
              Title
            </Label>
            <Input
              id="post-title"
              value={post.title}
              maxLength={120}
              onChange={(e) => patch({ title: e.target.value })}
              className="h-11 text-base font-medium"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="post-excerpt" className="text-xs">
              Excerpt
            </Label>
            <Textarea
              id="post-excerpt"
              rows={2}
              value={post.excerpt}
              maxLength={240}
              placeholder="A one or two sentence summary shown on your blog page."
              onChange={(e) => patch({ excerpt: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="post-body" className="text-xs">
              Post
            </Label>
            <div
              role="toolbar"
              aria-label="Formatting"
              className="flex flex-wrap gap-0.5 rounded-t-md border border-b-0 bg-muted/50 p-1"
            >
              {TOOLS.map(({ format: f, label, icon: Icon }) => (
                <Button
                  key={f}
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label={label}
                  title={label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format(f)}
                >
                  <Icon />
                </Button>
              ))}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="Insert image"
                title="Insert image"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setPicking("inline")}
              >
                <ImagePlus />
              </Button>
            </div>
            <Textarea
              id="post-body"
              ref={bodyRef}
              rows={18}
              value={post.body}
              onKeyDown={onBodyKey}
              onChange={(e) => patch({ body: e.target.value })}
              placeholder="Start writing… Leave a blank line between paragraphs."
              className="-mt-1.5 rounded-t-none font-mono text-[13px] leading-relaxed"
            />
            <p className="flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground">
              <span aria-live="polite">
                {words} word{words === 1 ? "" : "s"} · {readingMinutes(post.body)} min read
              </span>
              <span>## heading · **bold** · *italic* · &gt; quote · - list · [text](url)</span>
            </p>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4 p-4">
            <p className="text-sm font-medium">Publishing</p>
            <Segmented
              label="Status"
              value={post.status}
              onChange={(v) => (v === post.status ? undefined : togglePublish())}
              options={[
                ["draft", "Draft"],
                ["published", "Published"],
              ]}
            />
            <div className="space-y-1.5">
              <Label htmlFor="post-date" className="text-xs">
                Post date
              </Label>
              <Input
                id="post-date"
                type="date"
                value={post.date}
                onChange={(e) => e.target.value && patch({ date: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="post-slug" className="text-xs">
                Address
              </Label>
              <Input
                id="post-slug"
                value={slugDraft ?? post.slug}
                onChange={(e) => setSlugDraft(e.target.value.toLowerCase())}
                onBlur={commitSlug}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="h-9 text-xs"
              />
              <p className="break-all text-[11px] text-muted-foreground">{postUrl}</p>
            </div>
          </Panel>

          <Panel className="space-y-3 p-4">
            <p className="text-sm font-medium">Cover image</p>
            {post.cover ? (
              <img
                src={img(post.cover, 640, 360)}
                alt="Cover"
                className="aspect-[16/9] w-full rounded object-cover"
              />
            ) : (
              <div className="grid aspect-[16/9] place-items-center rounded border border-dashed text-xs text-muted-foreground">
                No cover image
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setPicking("cover")}>
                <ImagePlus /> {post.cover ? "Change cover" : "Add cover"}
              </Button>
              {post.cover ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => patch({ cover: "" })}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </Panel>

          <Panel className="space-y-3 p-4">
            <p className="text-sm font-medium">Tags</p>
            {post.tags.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
                {post.tags.map((t) => (
                  <li
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pl-2.5 pr-1 text-xs"
                  >
                    #{t}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      onClick={() => patch({ tags: post.tags.filter((x) => x !== t) })}
                      className="grid h-4 w-4 place-items-center rounded-full hover:bg-background"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <Input
              value={tagDraft}
              aria-label="Add tag"
              placeholder="Add a tag and press Enter"
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              className="h-9 text-xs"
            />
          </Panel>

          <Panel className="space-y-3 p-4">
            <p className="text-sm font-medium">Search engine listing</p>
            <div className="space-y-1.5">
              <Label htmlFor="post-seo-title" className="flex justify-between text-xs">
                <span>SEO title</span>
                <CharCount value={post.seoTitle.length || seoTitle.length} max={SEO_TITLE_MAX} />
              </Label>
              <Input
                id="post-seo-title"
                value={post.seoTitle}
                placeholder={post.title}
                onChange={(e) => patch({ seoTitle: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="post-seo-desc" className="flex justify-between text-xs">
                <span>Meta description</span>
                <CharCount value={seoDesc.length} max={SEO_DESC_MAX} />
              </Label>
              <Textarea
                id="post-seo-desc"
                rows={3}
                value={post.seoDescription}
                placeholder={plainText(post.excerpt) || "Defaults to the excerpt"}
                onChange={(e) => patch({ seoDescription: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="rounded-md border bg-card p-3" aria-label="Search result preview">
              <p className="truncate text-[11px] text-success">{postUrl}</p>
              <p className="truncate text-sm text-info">{seoTitle}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">{seoDesc}</p>
            </div>
          </Panel>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 /> Delete post
          </Button>
        </div>
      </div>

      <PhotoPickerDialog
        open={picking === "cover"}
        onOpenChange={(o) => !o && setPicking(null)}
        initial={post.cover ? [post.cover] : []}
        onPick={([p]) => patch({ cover: p ?? "" })}
      />
      <PhotoPickerDialog
        open={picking === "inline"}
        onOpenChange={(o) => !o && setPicking(null)}
        onPick={([p]) => {
          if (!p) return;
          const at = bodyRef.current?.selectionEnd ?? post.body.length;
          const next = insertImage(post.body, at, p);
          setBody(next.text, next.selStart, next.selEnd);
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              “{post.title || "Untitled post"}” will be removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                update((s) => ({ posts: s.posts.filter((p) => p.id !== post.id) }));
                toast.success("Post deleted");
                void navigate({ to: "/website/blog" });
              }}
            >
              Delete post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CharCount({ value, max }: { value: number; max: number }) {
  return (
    <span className={cn("font-normal", value > max ? "text-warning" : "text-muted-foreground")}>
      {value}/{max}
    </span>
  );
}
