import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  ImageOff,
  MoreHorizontal,
  Newspaper,
  PencilLine,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  TabBar,
  pageHead,
} from "@/components/kit";
import { ScrollRow, WebsiteTabs } from "@/components/website";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useWebsite } from "@/lib/website-store";
import { img } from "@/lib/demo-data";
import {
  filterPosts,
  formatPostDate,
  newPost,
  plainText,
  readingMinutes,
  uniquePostSlug,
  type BlogPost,
  type PostFilter,
} from "@/lib/website-blog";
import { createPage, pagePath, uid } from "@/lib/website-pages";

export const Route = createFileRoute("/_app/website/blog/")({
  head: () => pageHead("Website Blog", "Write and manage posts for your website's blog."),
  component: BlogList,
});

function BlogList() {
  const { site, update } = useWebsite();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PostFilter>("all");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const rows = filterPosts(site.posts, filter, query);
  const count = (f: PostFilter) => filterPosts(site.posts, f, "").length;
  const blogPage = site.pages.find((p) => p.sections.some((s) => s.kind === "blog"));

  const patchPost = (id: string, patch: Partial<BlogPost>) =>
    update((s) => ({
      posts: s.posts.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    }));

  const create = () => {
    const post = newPost(site.posts, new Date().toISOString().slice(0, 10));
    update((s) => ({ posts: [post, ...s.posts] }));
    void navigate({ to: "/website/blog/$postId", params: { postId: post.id } });
  };

  const duplicate = (post: BlogPost) => {
    const title = `${post.title} (copy)`;
    const copy: BlogPost = {
      ...post,
      id: uid("post"),
      title,
      slug: uniquePostSlug(site.posts, title),
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
    update((s) => ({ posts: [copy, ...s.posts] }));
    toast.success("Post duplicated as a draft");
  };

  const addBlogPage = () => {
    const page = createPage(site.pages, { kind: "blog", title: "Blog" });
    update((s) => ({ pages: [...s.pages, page] }));
    toast.success("Blog page added to your site menu", {
      description: `Published posts will appear at ${pagePath(page)}.`,
    });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <WebsiteTabs />
      <PageHeader
        title="Blog"
        description="Write stories, tips and session recaps for your website."
        actions={
          <Button size="sm" onClick={create}>
            <Plus /> New post
          </Button>
        }
      />

      {blogPage ? (
        <p className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Newspaper className="h-3.5 w-3.5" /> Published posts appear on your{" "}
          <Link
            to="/website/pages/$pageId"
            params={{ pageId: blogPage.id }}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {blogPage.title} page ({pagePath(blogPage)})
          </Link>
          .
        </p>
      ) : (
        <Panel className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Your blog isn't on your site yet</p>
            <p className="text-xs text-muted-foreground">
              Add a blog page so visitors can read your published posts.
            </p>
          </div>
          <Button size="sm" variant="outline" className="bg-card" onClick={addBlogPage}>
            <Plus /> Add blog page
          </Button>
        </Panel>
      )}

      <div className="relative mb-4 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          aria-label="Search posts"
          className="h-9 bg-card pl-8 text-xs"
        />
      </div>
      <ScrollRow>
        <TabBar
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: `All (${count("all")})` },
            { value: "published", label: `Published (${count("published")})` },
            { value: "draft", label: `Drafts (${count("draft")})` },
          ]}
        />
      </ScrollRow>

      <Panel className="mt-4">
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={site.posts.length === 0 ? "No posts yet" : "No posts match"}
              description={
                site.posts.length === 0
                  ? "Write your first post to share a recent session or tips for clients."
                  : "Try another filter or search term."
              }
              action={
                site.posts.length === 0 ? (
                  <Button size="sm" onClick={create}>
                    <Plus /> New post
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <ul aria-label="Posts" className="divide-y">
            {rows.map((p) => (
              <li key={p.id} className="flex items-start gap-3 px-4 py-3">
                {p.cover ? (
                  <img
                    src={img(p.cover, 160, 120)}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="grid h-14 w-20 shrink-0 place-items-center rounded bg-muted text-muted-foreground">
                    <ImageOff className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    to="/website/blog/$postId"
                    params={{ postId: p.id }}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {p.title || "Untitled post"}
                  </Link>
                  {p.excerpt ? (
                    <p className="truncate text-xs text-muted-foreground">{plainText(p.excerpt)}</p>
                  ) : null}
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <StatusBadge status={p.status} />
                    <span>{formatPostDate(p.date)}</span>
                    <span>· {readingMinutes(p.body)} min read</span>
                    {p.tags.map((t) => (
                      <span key={t} className="rounded bg-muted px-1.5 py-0.5">
                        #{t}
                      </span>
                    ))}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      aria-label={`Actions for ${p.title}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() =>
                        void navigate({ to: "/website/blog/$postId", params: { postId: p.id } })
                      }
                    >
                      <PencilLine /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        void navigate({
                          to: "/website/blog/$postId/preview",
                          params: { postId: p.id },
                        })
                      }
                    >
                      <Eye /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => {
                        const publish = p.status === "draft";
                        patchPost(p.id, { status: publish ? "published" : "draft" });
                        toast.success(publish ? "Post published" : "Post moved to drafts", {
                          description: publish
                            ? "It goes live with your next website publish."
                            : undefined,
                        });
                      }}
                    >
                      {p.status === "draft" ? <Send /> : <EyeOff />}
                      {p.status === "draft" ? "Publish" : "Unpublish"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => duplicate(p)}>
                      <Copy /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => setDeleting(p)}
                    >
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the post from your draft site. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleting) return;
                update((s) => ({ posts: s.posts.filter((p) => p.id !== deleting.id) }));
                toast.success("Post deleted");
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
