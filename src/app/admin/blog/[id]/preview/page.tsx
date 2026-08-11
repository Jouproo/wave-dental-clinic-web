export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getPostByIdForAdmin } from "@/lib/blog";
import ArticleView from "@/components/blog/ArticleView";

export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostByIdForAdmin(id);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm text-center py-2.5 px-4">
        معاينة داخلية — هذه ليست الصفحة العامة. الحالة الحالية: <strong>{post.status}</strong>
      </div>
      <div className="py-8">
        <ArticleView post={post} />
      </div>
    </div>
  );
}
