import DOMPurify from "isomorphic-dompurify";
import type { TocEntry } from "@/types/blog";

// Basic Arabic → Latin transliteration. Next.js's dynamic page-route
// matching (page.tsx, both dev and production builds — confirmed by
// direct testing) fails to resolve percent-encoded non-ASCII [slug]
// segments, even though the same params resolve fine in a route.ts
// handler. Route handlers aren't a substitute for page.tsx, so slugs
// must stay ASCII rather than working around it downstream.
const ARABIC_TRANSLITERATION: Record<string, string> = {
  "ا": "a", "أ": "a", "إ": "i", "آ": "aa", "ب": "b", "ت": "t", "ث": "th",
  "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z",
  "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a",
  "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y", "ى": "a", "ة": "h", "ء": "a", "ئ": "e", "ؤ": "o",
};

function transliterate(input: string): string {
  return [...input].map((ch) => ARABIC_TRANSLITERATION[ch] ?? ch).join("");
}

export function slugify(input: string): string {
  const base = transliterate(input)
    .trim()
    // strip Arabic diacritics (tashkeel) and any Arabic letters the map missed
    .replace(/[؀-ۿ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (base) return base;
  // Pure-Arabic or otherwise unrepresentable title — fall back to a
  // short unique ASCII slug; the admin can still rename it by hand.
  return `post-${Math.random().toString(36).slice(2, 8)}`;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** ~180 wpm — a reasonable pace for mixed Arabic/English reading. */
export function estimateReadingTime(html: string): number {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

/**
 * Adds stable `id` attributes to every H2/H3 in the HTML and returns a flat
 * table-of-contents alongside it. Run this once when a post is saved, not
 * on every request — the ids and body_html should stay in sync.
 */
export function extractHeadingsAndInjectIds(html: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const seen = new Map<string, number>();

  const resultHtml = html.replace(
    /<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match: string, tag: string, attrs: string, inner: string) => {
      const level = tag.toLowerCase() === "h2" ? 2 : 3;
      const text = stripHtml(inner).trim();
      if (!text) return match;

      let id = slugify(text) || `section-${toc.length + 1}`;
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) id = `${id}-${count + 1}`;

      toc.push({ id, level: level as 2 | 3, text });
      const cleanedAttrs = attrs.replace(/\s+id="[^"]*"/i, "");
      return `<${tag}${cleanedAttrs} id="${id}">${inner}</${tag}>`;
    }
  );

  return { html: resultHtml, toc };
}

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "b", "i", "u", "s", "a", "ul", "ol", "li",
  "h2", "h3", "blockquote", "table", "thead", "tbody", "tr", "th", "td",
  "img", "figure", "figcaption", "div", "span", "hr", "code", "pre",
];
const ALLOWED_ATTR = [
  "href", "target", "rel", "src", "alt", "title", "class", "id", "colspan", "rowspan", "width", "height",
];

/**
 * The only place article HTML is allowed to reach the DOM.
 * Called on save (defense #1) and again right before rendering
 * (defense #2) — never trust a stored string on its own.
 */
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  }) as unknown as string;
}

export function excerptFromHtml(html: string, maxLen = 160): string {
  const text = stripHtml(html);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}
