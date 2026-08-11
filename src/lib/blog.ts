import { supabaseServer } from "@/lib/supabase";
import type {
  DbBlogPost,
  DbBlogCategory,
  DbBlogAuthor,
  DbBlogPostSource,
  DbBlogPostFaq,
  BlogPostWithRelations,
} from "@/types/blog";

const POST_SELECT = `
  *,
  category:blog_categories!category_id(*),
  author:blog_authors!author_id(*),
  reviewer:blog_authors!reviewer_id(*)
`;

/**
 * Self-healing "scheduled" publish: flips any due scheduled post to
 * published right before a public read, instead of relying on a cron
 * job the project doesn't have. Cheap no-op when nothing is due.
 */
export async function publishDuePosts(): Promise<void> {
  const supabase = supabaseServer();
  await supabase
    .from("blog_posts")
    .update({ status: "published" })
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString());
  // published_at defaults via a second pass so we don't clobber a
  // pre-set published_at on posts that were scheduled then hand-edited.
  await supabase
    .from("blog_posts")
    .update({ published_at: new Date().toISOString() })
    .eq("status", "published")
    .is("published_at", null);
}

export interface PublicPostFilters {
  categorySlug?: string;
  search?: string;
  featuredOnly?: boolean;
  page?: number;
  perPage?: number;
}

export async function getPublishedPosts(filters: PublicPostFilters = {}): Promise<{
  posts: BlogPostWithRelations[];
  total: number;
}> {
  await publishDuePosts();
  const supabase = supabaseServer();
  const page = filters.page ?? 1;
  const perPage = filters.perPage ?? 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("blog_posts")
    .select(POST_SELECT, { count: "exact" })
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .range(from, to);

  if (filters.featuredOnly) query = query.eq("featured", true);
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`);
  }
  if (filters.categorySlug) {
    const { data: cat } = await supabase
      .from("blog_categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .eq("status", "active")
      .maybeSingle();
    if (!cat) return { posts: [], total: 0 };
    query = query.eq("category_id", cat.id);
  }

  const { data, error, count } = await query;
  if (error || !data) return { posts: [], total: 0 };
  return { posts: data as unknown as BlogPostWithRelations[], total: count ?? 0 };
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPostWithRelations | null> {
  await publishDuePosts();
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) return null;
  return hydratePost(data as unknown as BlogPostWithRelations);
}

/** Any status — used by the protected admin preview route only. */
export async function getPostByIdForAdmin(id: string): Promise<BlogPostWithRelations | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase.from("blog_posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return hydratePost(data as unknown as BlogPostWithRelations);
}

async function hydratePost(post: BlogPostWithRelations): Promise<BlogPostWithRelations> {
  const supabase = supabaseServer();
  const [sourcesRes, faqsRes, relatedRes] = await Promise.all([
    supabase.from("blog_post_sources").select("*").eq("post_id", post.id).order("sort_order"),
    supabase.from("blog_post_faqs").select("*").eq("post_id", post.id).order("sort_order"),
    supabase
      .from("blog_post_related")
      .select("related_post_id, sort_order, related:blog_posts!related_post_id(*)")
      .eq("post_id", post.id)
      .order("sort_order"),
  ]);

  const relatedPosts = ((relatedRes.data ?? []) as unknown as { related: DbBlogPost | null }[])
    .map((r) => r.related)
    .filter((p): p is DbBlogPost => !!p && p.status === "published");

  return {
    ...post,
    sources: (sourcesRes.data ?? []) as DbBlogPostSource[],
    faqs: (faqsRes.data ?? []) as DbBlogPostFaq[],
    related_posts: relatedPosts,
  };
}

export async function getActiveCategories(): Promise<DbBlogCategory[]> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("status", "active")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<DbBlogCategory | null> {
  const supabase = supabaseServer();
  const { data } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  return data ?? null;
}

export async function getActiveAuthors(): Promise<DbBlogAuthor[]> {
  const supabase = supabaseServer();
  const { data } = await supabase.from("blog_authors").select("*").eq("status", "active").order("name_ar");
  return data ?? [];
}
