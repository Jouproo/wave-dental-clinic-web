import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/shared/FloatingWhatsAppButton";
import MobileStickyBar from "@/components/shared/MobileStickyBar";
import BlogPostCard from "@/components/blog/BlogPostCard";
import { getCategoryBySlug, getPublishedPosts } from "@/lib/blog";
import { getClinicSettings } from "@/lib/clinic-settings";
import { clinicConfig } from "@/config/clinic";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const title = category.seo_title || `${category.name} | دليل الأسنان`;
  const description = category.seo_description || category.description || `مقالات عن ${category.name} من دليل Wave Dental Clinic.`;

  return {
    title,
    description,
    alternates: { canonical: `/blog/category/${slug}` },
    openGraph: { title, description, url: `${clinicConfig.seo.url}/blog/category/${slug}`, type: "website" },
  };
}

export default async function BlogCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = parseInt(sp.page ?? "1", 10) || 1;
  const settings = await getClinicSettings();
  const { posts, total } = await getPublishedPosts({ categorySlug: slug, page, perPage: 12 });
  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header settings={settings} />
      <main className="pt-24 pb-[68px] md:pb-0">
        <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 text-sm text-slate-500">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="hover:text-blue-600">الرئيسية</Link></li>
            <li aria-hidden="true"><ChevronLeft className="w-3.5 h-3.5" /></li>
            <li><Link href="/blog" className="hover:text-blue-600">دليل الأسنان</Link></li>
            <li aria-hidden="true"><ChevronLeft className="w-3.5 h-3.5" /></li>
            <li aria-current="page" className="text-slate-700 font-medium">{category.name}</li>
          </ol>
        </nav>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">{category.name}</h1>
          {category.description && <p className="text-slate-500 max-w-2xl">{category.description}</p>}
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl mb-10">
              <p className="text-slate-500">لا توجد مقالات منشورة في هذا التصنيف بعد.</p>
              <Link href="/blog" className="text-blue-600 hover:underline text-sm mt-2 inline-block">تصفح كل المقالات</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
              {posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="صفحات التصنيف" className="flex items-center justify-center gap-2 pb-14">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={{ pathname: `/blog/category/${slug}`, query: { page: p } }}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium ${
                    p === page ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </main>
      <Footer settings={settings} pageType="other_public" />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
      <MobileStickyBar settings={settings} pageType="other_public" />
    </div>
  );
}
