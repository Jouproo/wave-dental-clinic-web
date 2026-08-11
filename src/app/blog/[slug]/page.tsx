import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/shared/FloatingWhatsAppButton";
import MobileStickyBar from "@/components/shared/MobileStickyBar";
import ArticleView from "@/components/blog/ArticleView";
import { getPublishedPostBySlug } from "@/lib/blog";
import { getClinicSettings } from "@/lib/clinic-settings";
import { clinicConfig } from "@/config/clinic";
import { stripHtml } from "@/lib/blog-utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};

  const title = post.seo_title || post.title;
  const description = post.meta_description || post.excerpt || stripHtml(post.body_html ?? "").slice(0, 155);
  const url = `${clinicConfig.seo.url}/blog/${slug}`;
  const image = post.og_image_url || post.cover_image_url || undefined;

  return {
    title,
    description,
    alternates: { canonical: post.canonical_override || `/blog/${slug}` },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

function ArticleJsonLd({ post, slug }: { post: NonNullable<Awaited<ReturnType<typeof getPublishedPostBySlug>>>; slug: string }) {
  const url = `${clinicConfig.seo.url}/blog/${slug}`;
  const siteUrl = clinicConfig.seo.url;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}/#article`,
      headline: post.title,
      description: post.meta_description || post.excerpt || undefined,
      image: post.cover_image_url || undefined,
      url,
      mainEntityOfPage: url,
      datePublished: post.published_at || undefined,
      dateModified: post.updated_at,
      articleSection: post.category?.name,
      publisher: { "@id": `${siteUrl}/#clinic` },
      ...(post.author
        ? { author: { "@type": "Person", name: post.author.name_ar, url: post.author.profile_url || undefined } }
        : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "دليل الأسنان", item: `${siteUrl}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];

  if (post.reviewer) {
    graph.push({
      "@type": "Person",
      "@id": `${siteUrl}/#reviewer-${post.reviewer.id}`,
      name: post.reviewer.name_ar,
      jobTitle: post.reviewer.role || undefined,
      description: post.reviewer.credentials || undefined,
    });
  }

  if (post.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: post.faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const settings = await getClinicSettings();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <ArticleJsonLd post={post} slug={slug} />
      <Header settings={settings} />
      <main className="pt-24 pb-[68px] md:pb-0">
        <ArticleView post={post} />
      </main>
      <Footer settings={settings} />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
      <MobileStickyBar settings={settings} />
    </div>
  );
}
