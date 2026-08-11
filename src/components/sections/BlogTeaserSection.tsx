import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";
import BlogPostCard from "@/components/blog/BlogPostCard";
import { getPublishedPosts } from "@/lib/blog";

export default async function BlogTeaserSection() {
  const { posts } = await getPublishedPosts({ perPage: 3 });

  return (
    <section id="blog" aria-labelledby="blog-heading" className="py-14 md:py-20 lg:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="دليل الأسنان"
          title="معلومات موثوقة تساعدك تفهم صحة أسنانك"
          subtitle="مقالات وإجابات طبية راجعها أطباء متخصصون لمساعدتك على فهم حالتك قبل اتخاذ القرار."
        />

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3 py-10 mb-8 border border-dashed border-slate-200 rounded-2xl bg-white">
            <BookOpen className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 text-sm max-w-md">
              نعمل على إعداد محتوى طبي موثوق. تصفح الدليل لمتابعة أحدث المقالات أول بأول.
            </p>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-6 py-3.5 rounded-xl transition-colors border border-blue-200"
          >
            تصفح دليل الأسنان
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
