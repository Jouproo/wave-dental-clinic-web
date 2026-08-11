import { supabaseServer } from "@/lib/supabase";
import { slugify, sanitizeArticleHtml, extractHeadingsAndInjectIds } from "@/lib/blog-utils";

/**
 * Builds an UPDATE/INSERT payload from only the keys actually present in
 * `body`. This must stay partial-safe: the admin list's quick-action
 * buttons (publish/archive/unpublish) PUT only `{ status }`, and an
 * earlier version of this function defaulted every other field to
 * empty/null, silently wiping the post's title and body on every
 * status toggle. Never reintroduce unconditional defaults here.
 */
export function buildPostFields(body: Record<string, unknown>, existingSlug?: string) {
  const fields: Record<string, unknown> = {};

  if ("title" in body) fields.title = body.title as string;

  if ("body_html" in body) {
    const rawHtml = typeof body.body_html === "string" ? body.body_html : "";
    const sanitized = sanitizeArticleHtml(rawHtml);
    const { html: htmlWithIds } = extractHeadingsAndInjectIds(sanitized);
    fields.body_html = htmlWithIds;
  }
  if ("body_json" in body) fields.body_json = body.body_json ?? null;

  if ("slug" in body || "title" in body) {
    const explicitSlug = (body.slug as string)?.trim();
    const titleForSlug = (body.title as string) ?? "";
    fields.slug = explicitSlug || existingSlug || slugify(titleForSlug);
  }

  if ("excerpt" in body) fields.excerpt = (body.excerpt as string) ?? null;
  if ("cover_image_url" in body) fields.cover_image_url = (body.cover_image_url as string) ?? null;
  if ("cover_image_alt" in body) fields.cover_image_alt = (body.cover_image_alt as string) ?? null;
  if ("category_id" in body) fields.category_id = (body.category_id as string) || null;
  if ("author_id" in body) fields.author_id = (body.author_id as string) || null;
  if ("reviewer_id" in body) fields.reviewer_id = (body.reviewer_id as string) || null;
  if ("status" in body) fields.status = body.status as string;
  if ("featured" in body) fields.featured = !!body.featured;
  if ("related_service_id" in body) fields.related_service_id = (body.related_service_id as string) || null;
  if ("tags" in body) fields.tags = Array.isArray(body.tags) ? body.tags : [];
  if ("seo_title" in body) fields.seo_title = (body.seo_title as string) ?? null;
  if ("meta_description" in body) fields.meta_description = (body.meta_description as string) ?? null;
  if ("canonical_override" in body) fields.canonical_override = (body.canonical_override as string) ?? null;
  if ("og_image_url" in body) fields.og_image_url = (body.og_image_url as string) ?? null;
  if ("focus_keyword" in body) fields.focus_keyword = (body.focus_keyword as string) ?? null;
  if ("medical_disclaimer" in body) fields.medical_disclaimer = (body.medical_disclaimer as string) ?? null;
  if ("scheduled_at" in body) fields.scheduled_at = (body.scheduled_at as string) || null;
  if ("reviewed_at" in body) fields.reviewed_at = (body.reviewed_at as string) || null;

  return fields as {
    title?: string;
    slug?: string;
    excerpt?: string | null;
    body_json?: unknown;
    body_html?: string;
    cover_image_url?: string | null;
    cover_image_alt?: string | null;
    category_id?: string | null;
    author_id?: string | null;
    reviewer_id?: string | null;
    status?: string;
    featured?: boolean;
    related_service_id?: string | null;
    tags?: string[];
    seo_title?: string | null;
    meta_description?: string | null;
    canonical_override?: string | null;
    og_image_url?: string | null;
    focus_keyword?: string | null;
    medical_disclaimer?: string | null;
    scheduled_at?: string | null;
    reviewed_at?: string | null;
  };
}

export async function syncChildren(
  postId: string,
  body: {
    sources?: { title: string; url: string }[];
    faqs?: { question: string; answer: string }[];
    related_post_ids?: string[];
  }
) {
  const supabase = supabaseServer();

  if (Array.isArray(body.sources)) {
    await supabase.from("blog_post_sources").delete().eq("post_id", postId);
    const rows = body.sources
      .filter((s) => s.title?.trim() && s.url?.trim())
      .map((s, i) => ({ post_id: postId, title: s.title, url: s.url, sort_order: i }));
    if (rows.length) await supabase.from("blog_post_sources").insert(rows);
  }

  if (Array.isArray(body.faqs)) {
    await supabase.from("blog_post_faqs").delete().eq("post_id", postId);
    const rows = body.faqs
      .filter((f) => f.question?.trim() && f.answer?.trim())
      .map((f, i) => ({ post_id: postId, question: f.question, answer: f.answer, sort_order: i }));
    if (rows.length) await supabase.from("blog_post_faqs").insert(rows);
  }

  if (Array.isArray(body.related_post_ids)) {
    await supabase.from("blog_post_related").delete().eq("post_id", postId);
    const rows = body.related_post_ids
      .filter((id) => id && id !== postId)
      .map((id, i) => ({ post_id: postId, related_post_id: id, sort_order: i }));
    if (rows.length) await supabase.from("blog_post_related").insert(rows);
  }
}
