import Link from "next/link";
import Image from "next/image";
import { Clock, ImageOff } from "lucide-react";
import { estimateReadingTime } from "@/lib/blog-utils";
import type { BlogPostWithRelations } from "@/types/blog";

export default function BlogPostCard({ post }: { post: BlogPostWithRelations }) {
  const readingTime = estimateReadingTime(post.body_html ?? "");

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden"
    >
      <div className="relative aspect-video bg-slate-100">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt || post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ImageOff className="w-8 h-8" />
          </div>
        )}
        {post.category && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {post.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-bold text-slate-800 text-base leading-7 mb-2 line-clamp-2">{post.title}</h3>
        {post.excerpt && <p className="text-sm text-slate-500 leading-6 line-clamp-2 mb-3">{post.excerpt}</p>}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>{post.author?.name_ar ?? "فريق العيادة"}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {readingTime} د</span>
        </div>
      </div>
    </Link>
  );
}
