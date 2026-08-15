import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Clock, Calendar, ShieldCheck, MessageCircle, ArrowRight, ExternalLink } from "lucide-react";
import { sanitizeArticleHtml, extractHeadingsAndInjectIds, estimateReadingTime } from "@/lib/blog-utils";
import { getWhatsAppUrl } from "@/config/clinic";
import { services as staticServices } from "@/data/services";
import type { BlogPostWithRelations } from "@/types/blog";
import TrackedLink from "@/components/analytics/TrackedLink";
import ArticleReadTracker from "@/components/analytics/ArticleReadTracker";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export default function ArticleView({
  post,
  relatedServiceTitle,
}: {
  post: BlogPostWithRelations;
  relatedServiceTitle?: string | null;
}) {
  const html = sanitizeArticleHtml(post.body_html ?? "");
  const { html: htmlWithIds, toc } = extractHeadingsAndInjectIds(html);
  const readingTime = estimateReadingTime(html);
  const publishedLabel = formatDate(post.published_at);
  const reviewedLabel = formatDate(post.reviewed_at);
  const serviceTitle =
    relatedServiceTitle ?? staticServices.find((s) => s.id === post.related_service_id)?.title ?? null;

  const whatsappUrl = getWhatsAppUrl(
    `قرأت مقال "${post.title}" على موقع Wave Dental Clinic وأرغب في الاستفسار عن حالتي.`
  );

  return (
    <article dir="rtl">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-4 pt-4 text-sm text-slate-500">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li><Link href="/" className="hover:text-blue-600">الرئيسية</Link></li>
          <li aria-hidden="true"><ChevronLeft className="w-3.5 h-3.5" /></li>
          <li><Link href="/blog" className="hover:text-blue-600">دليل الأسنان</Link></li>
          {post.category && (
            <>
              <li aria-hidden="true"><ChevronLeft className="w-3.5 h-3.5" /></li>
              <li><Link href={`/blog/category/${post.category.slug}`} className="hover:text-blue-600">{post.category.name}</Link></li>
            </>
          )}
          <li aria-hidden="true"><ChevronLeft className="w-3.5 h-3.5" /></li>
          <li aria-current="page" className="text-slate-700 font-medium truncate max-w-[200px]">{post.title}</li>
        </ol>
      </nav>

      {/* Header */}
      <header className="max-w-3xl mx-auto px-4 pt-6 pb-8">
        {post.category && (
          <Link href={`/blog/category/${post.category.slug}`} className="inline-block text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700 mb-4">
            {post.category.name}
          </Link>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-4">{post.title}</h1>
        {post.excerpt && <p className="text-lg text-slate-500 leading-relaxed mb-5">{post.excerpt}</p>}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 border-t border-slate-100 pt-4">
          {post.author && (
            <span className="flex items-center gap-2">
              {post.author.image_url && (
                <Image src={post.author.image_url} alt={post.author.name_ar} width={28} height={28} className="rounded-full object-cover w-7 h-7" unoptimized />
              )}
              <span className="font-medium text-slate-700">{post.author.name_ar}</span>
            </span>
          )}
          {publishedLabel && (
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {publishedLabel}</span>
          )}
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {readingTime} دقيقة قراءة</span>
        </div>

        {post.reviewer && (
          <div className="flex items-center gap-2 mt-3 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5 w-fit">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>
              راجعه طبيًا: <strong>{post.reviewer.name_ar}</strong>
              {post.reviewer.credentials ? ` — ${post.reviewer.credentials}` : ""}
              {reviewedLabel ? ` (${reviewedLabel})` : ""}
            </span>
          </div>
        )}
      </header>

      {/* Cover image */}
      {post.cover_image_url && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100">
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt || post.title}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 grid gap-8">
        {/* Table of contents — native <details>, no JS needed */}
        {toc.length >= 2 && (
          <details className="bg-slate-50 border border-slate-100 rounded-2xl p-4 open:pb-4" open>
            <summary className="font-bold text-slate-700 cursor-pointer select-none">محتويات المقال</summary>
            <nav className="mt-3">
              <ol className="space-y-1.5 text-sm">
                {toc.map((t) => (
                  <li key={t.id} className={t.level === 3 ? "mr-4" : ""}>
                    <a href={`#${t.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">{t.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </details>
        )}

        {/* Body */}
        <div
          id="article-body"
          className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-2xl"
          dangerouslySetInnerHTML={{ __html: htmlWithIds }}
        />
        <ArticleReadTracker targetId="article-body" />

        {/* Sources */}
        {post.sources.length > 0 && (
          <section aria-labelledby="sources-heading" className="border-t border-slate-100 pt-6">
            <h2 id="sources-heading" className="font-bold text-slate-700 mb-3">المصادر والمراجع</h2>
            <ul className="space-y-1.5 text-sm">
              {post.sources.map((s) => (
                <li key={s.id}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-blue-600 hover:underline flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" /> {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQs */}
        {post.faqs.length > 0 && (
          <section aria-labelledby="faq-heading" className="border-t border-slate-100 pt-6">
            <h2 id="faq-heading" className="font-bold text-slate-700 mb-3">أسئلة شائعة</h2>
            <div className="space-y-2">
              {post.faqs.map((f) => (
                <details key={f.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3">
                  <summary className="font-medium text-slate-700 cursor-pointer select-none">{f.question}</summary>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Medical disclaimer */}
        {post.medical_disclaimer && (
          <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-6">
            {post.medical_disclaimer}
          </p>
        )}

        {/* CTA */}
        <section className="bg-gradient-to-br from-blue-600 to-sky-600 rounded-2xl p-6 text-center">
          <h2 className="text-white font-bold text-xl mb-2">
            {serviceTitle ? `مهتم بـ${serviceTitle}؟` : "عندك سؤال عن حالتك؟"}
          </h2>
          <p className="text-white/80 text-sm mb-5">تواصل معنا وسيتم الرد على استفسارك بخطوات واضحة قبل أي قرار.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <TrackedLink
              event="article_cta_click"
              eventParams={{ cta_location: "article_footer", contact_method: "whatsapp", page_type: "blog_article" }}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5" /> تواصل عبر واتساب
            </TrackedLink>
            {post.related_service_id && (
              <TrackedLink
                event="article_cta_click"
                eventParams={{ cta_location: "article_footer_service_link", page_type: "blog_article" }}
                href={`/services/${post.related_service_id}`}
                className="flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                <ArrowRight className="w-4 h-4" /> تفاصيل الخدمة
              </TrackedLink>
            )}
          </div>
        </section>

        {/* Related articles */}
        {post.related_posts.length > 0 && (
          <section aria-labelledby="related-heading" className="border-t border-slate-100 pt-6 pb-10">
            <h2 id="related-heading" className="font-bold text-slate-700 mb-4">مقالات ذات صلة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.related_posts.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="block bg-white border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all">
                  <p className="font-semibold text-slate-800 text-sm mb-1">{r.title}</p>
                  {r.excerpt && <p className="text-slate-500 text-xs line-clamp-2">{r.excerpt}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
