import type { MetadataRoute } from "next";
import { clinicConfig } from "@/config/clinic";
import { services as staticServices } from "@/data/services";
import { supabaseServer } from "@/lib/supabase";
import { publishDuePosts } from "@/lib/blog";

async function getActiveServiceIds(): Promise<string[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return staticServices.map((s) => s.id);
    }
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("services")
      .select("id")
      .eq("status", "active");
    if (error || !data || data.length === 0) {
      return staticServices.map((s) => s.id);
    }
    return data.map((s: { id: string }) => s.id);
  } catch {
    return staticServices.map((s) => s.id);
  }
}

async function getBlogEntries(): Promise<{ slug: string; updated_at: string }[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
    await publishDuePosts();
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString());
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

async function getBlogCategorySlugs(): Promise<string[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
    const supabase = supabaseServer();
    const { data, error } = await supabase.from("blog_categories").select("slug").eq("status", "active");
    if (error || !data) return [];
    return data.map((c) => c.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clinicConfig.seo.url;
  const now = new Date();
  const [serviceIds, blogEntries, categorySlugs] = await Promise.all([
    getActiveServiceIds(),
    getBlogEntries(),
    getBlogCategorySlugs(),
  ]);

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...serviceIds.map((id) => ({
      url: `${base}/services/${id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${base}/blog`,
      lastModified: blogEntries[0]?.updated_at ? new Date(blogEntries[0].updated_at) : now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    ...categorySlugs.map((slug) => ({
      url: `${base}/blog/category/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...blogEntries.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
