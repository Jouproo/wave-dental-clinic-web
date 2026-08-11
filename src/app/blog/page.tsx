import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, MessageCircle, Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/shared/FloatingWhatsAppButton";
import MobileStickyBar from "@/components/shared/MobileStickyBar";
import BlogSearchBar from "@/components/blog/BlogSearchBar";
import BlogPostCard from "@/components/blog/BlogPostCard";
import { getPublishedPosts, getActiveCategories } from "@/lib/blog";
import { getClinicSettings, makeWhatsAppUrl } from "@/lib/clinic-settings";
import { clinicConfig } from "@/config/clinic";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "دليل الأسنان",
  description: "معلومات موثوقة تساعدك تفهم صحة أسنانك — مقالات وإجابات طبية راجعها أطباء متخصصون.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10) || 1;
  const isFiltered = !!(sp.category || sp.search);

  const [categories, settings, { posts, total }, overall] = await Promise.all([
    getActiveCategories(),
    getClinicSettings(),
    getPublishedPosts({ categorySlug: sp.category, search: sp.search, page, perPage: 12 }),
    getPublishedPosts({ perPage: 1 }),
  ]);

  const hasAnyPostsEver = overall.total > 0;
  const showFeatured = !isFiltered && page === 1;
  const featured = showFeatured ? posts.find((p) => p.featured) ?? null : null;
  const gridPosts = featured ? posts.filter((p) => p.id !== featured.id) : posts;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  const tourismCategory = categories.find((c) => c.slug === "dental-tourism");
  const tourismPosts = tourismCategory && !isFiltered
    ? (await getPublishedPosts({ categorySlug: tourismCategory.slug, perPage: 3 })).posts
    : [];

  const whatsappUrl = makeWhatsAppUrl(settings.whatsapp || clinicConfig.whatsappNumber, "مرحبًا، عندي سؤال بعد ما قرأت في دليل الأسنان بالموقع.");

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header settings={settings} />
      <main className="pt-24 pb-[68px] md:pb-0">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-14 md:py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              دليل Wave Dental Clinic
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
              معلومات موثوقة تساعدك تفهم صحة أسنانك
            </h1>
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              مقالات وإجابات طبية راجعها أطباء متخصصون لمساعدتك على فهم حالتك وخيارات العلاج قبل اتخاذ القرار.
            </p>
            <BlogSearchBar placeholder="ابحث عن مشكلة أو علاج..." />
          </div>
        </section>

        {!hasAnyPostsEver ? (
          <EmptyState />
        ) : (
          <>
            {/* Category chips */}
            {categories.length > 0 && (
              <nav aria-label="تصنيفات المدونة" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap gap-2 overflow-x-auto">
                <Link
                  href="/blog"
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    !sp.category ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  الكل
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/blog/category/${c.slug}`}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      sp.category === c.slug ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            )}

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Featured */}
              {featured && (
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group grid md:grid-cols-2 gap-6 bg-slate-50 rounded-3xl overflow-hidden mb-10 border border-slate-100 hover:border-blue-200 transition-colors"
                >
                  {featured.cover_image_url && (
                    <div className="relative w-full h-56 md:h-full">
                      <Image
                        src={featured.cover_image_url}
                        alt={featured.cover_image_alt || featured.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 mb-3">
                      <Sparkles className="w-3.5 h-3.5" /> مقال مميز
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors">
                      {featured.title}
                    </h2>
                    {featured.excerpt && <p className="text-slate-500 leading-relaxed">{featured.excerpt}</p>}
                  </div>
                </Link>
              )}

              {gridPosts.length === 0 ? (
                <NoResultsState />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                  {gridPosts.map((post) => <BlogPostCard key={post.id} post={post} />)}
                </div>
              )}

              {totalPages > 1 && (
                <nav aria-label="صفحات المدونة" className="flex items-center justify-center gap-2 pb-14">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={{ pathname: "/blog", query: { ...sp, page: p } }}
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

            {/* Dental tourism section */}
            {tourismPosts.length > 0 && tourismCategory && (
              <section className="bg-blue-50/60 py-14">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{tourismCategory.name}</h2>
                  <p className="text-slate-500 mb-6">معلومات لمرضى دول الخليج المهتمين بالعلاج في مصر</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tourismPosts.map((post) => <BlogPostCard key={post.id} post={post} />)}
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* CTA */}
        <section className="py-14 md:py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">عندك سؤال عن حالتك؟</h2>
            <p className="text-slate-500 mb-8">تواصل معنا مباشرة وسيتم الرد على استفسارك</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" /> تواصل عبر واتساب
            </a>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
      <MobileStickyBar settings={settings} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
        <BookOpen className="w-8 h-8 text-blue-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">نعمل على إعداد محتوى طبي موثوق</h2>
      <p className="text-slate-500 mb-6">سيتم نشر مقالات وإجابات طبية جديدة قريبًا.</p>
      <Link
        href="/#contact"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        تواصل مع العيادة
      </Link>
    </div>
  );
}

function NoResultsState() {
  return (
    <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl mb-10">
      <p className="text-slate-500">لا توجد نتائج مطابقة لبحثك.</p>
      <Link href="/blog" className="text-blue-600 hover:underline text-sm mt-2 inline-block">عرض كل المقالات</Link>
    </div>
  );
}
