"use client";

import { useState } from "react";
import { MessageCircle, MessagesSquare, ExternalLink, Pencil, Loader2, X } from "lucide-react";
import { sanitizeChatUrl } from "@/lib/chat-links";

/**
 * The lead's existing conversations. Links open in a new tab, so staff read
 * the chat on WhatsApp / Meta Business Suite and come straight back to this
 * tab to log the outcome.
 */
export default function ChatLinks({
  whatsappChatUrl, metaChatUrl, onSave, saving,
}: {
  whatsappChatUrl: string | null;
  metaChatUrl: string | null;
  onSave: (patch: { whatsapp_chat_url: string; meta_chat_url: string }) => Promise<boolean>;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [wa, setWa] = useState(whatsappChatUrl ?? "");
  const [meta, setMeta] = useState(metaChatUrl ?? "");
  const [error, setError] = useState("");

  // Re-sanitize on render too: never trust a stored value blindly in an href.
  const waHref = sanitizeChatUrl(whatsappChatUrl);
  const metaHref = sanitizeChatUrl(metaChatUrl);

  async function submit() {
    for (const v of [wa, meta]) {
      if (v.trim() && !sanitizeChatUrl(v)) { setError("اللينك لازم يكون رابط ويب كامل، مثلاً https://…"); return; }
    }
    setError("");
    if (await onSave({ whatsapp_chat_url: wa.trim(), meta_chat_url: meta.trim() })) setEditing(false);
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500">المحادثات السابقة</p>
        {!editing && (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600">
            <Pencil className="w-3.5 h-3.5" /> {waHref || metaHref ? "تعديل اللينكات" : "إضافة لينك"}
          </button>
        )}
      </div>

      {!editing ? (
        waHref || metaHref ? (
          <div className="flex flex-wrap gap-2">
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold">
                <MessageCircle className="w-4 h-4" /> افتح شات الواتساب <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}
            {metaHref && (
              <a href={metaHref} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">
                <MessagesSquare className="w-4 h-4" /> افتح الشات على Meta <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">مفيش لينك محادثة محفوظ للعميل ده.</p>
        )
      ) : (
        <div className="space-y-2">
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><MessageCircle className="w-3.5 h-3.5 text-green-600" /> لينك شات الواتساب</span>
            <input value={wa} onChange={(e) => setWa(e.target.value)} dir="ltr" placeholder="https://wa.me/…" className="input text-left" />
          </label>
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><MessagesSquare className="w-3.5 h-3.5 text-indigo-600" /> لينك الشات على Meta Business Suite</span>
            <input value={meta} onChange={(e) => setMeta(e.target.value)} dir="ltr" placeholder="https://business.facebook.com/latest/inbox/…" className="input text-left" />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={submit} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} حفظ
            </button>
            <button
              onClick={() => { setEditing(false); setWa(whatsappChatUrl ?? ""); setMeta(metaChatUrl ?? ""); setError(""); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:bg-gray-100 rounded-xl"
            >
              <X className="w-4 h-4" /> إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
