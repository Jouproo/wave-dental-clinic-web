import { NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/blog";
import { clinicConfig } from "@/config/clinic";
import { stripHtml } from "@/lib/blog-utils";

export const revalidate = 300;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const base = clinicConfig.seo.url;
  const { posts } = await getPublishedPosts({ perPage: 30 });

  const items = posts
    .map((p) => {
      const url = `${base}/blog/${p.slug}`;
      const description = p.excerpt || stripHtml(p.body_html ?? "").slice(0, 200);
      const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : new Date(p.created_at).toUTCString();
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>دليل الأسنان — ${escapeXml(clinicConfig.clinicName)}</title>
    <link>${base}/blog</link>
    <description>مقالات وإجابات طبية موثوقة من ${escapeXml(clinicConfig.clinicName)}</description>
    <language>ar</language>${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
