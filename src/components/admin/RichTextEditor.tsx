"use client";

import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote,
  LinkIcon, ImageIcon, Table as TableIcon, Undo, Redo, StickyNote, Link2Off,
} from "lucide-react";
import { CalloutNote } from "./CalloutNoteExtension";

interface RichTextEditorProps {
  initialContent?: JSONContent | string | null;
  onChange: (payload: { html: string; json: JSONContent }) => void;
}

export default function RichTextEditor({ initialContent, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      ImageExt.configure({ inline: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "ابدأ كتابة محتوى المقال هنا…" }),
      CalloutNote,
    ],
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none focus:outline-none min-h-[320px] px-4 py-3",
        dir: "rtl",
      },
    },
    onUpdate: ({ editor }) => {
      onChange({ html: editor.getHTML(), json: editor.getJSON() });
    },
  });

  // Emit the initial content once on mount so the parent form's state
  // (used for save/publish) matches what's actually loaded in the editor.
  useEffect(() => {
    if (editor) onChange({ html: editor.getHTML(), json: editor.getJSON() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return <div className="min-h-[320px] rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />;

  function addLink() {
    const url = window.prompt("رابط الوصلة:");
    if (!url) return;
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function addImage() {
    const url = window.prompt("رابط الصورة (ارفعها أولًا من مدير الصور ثم الصق الرابط هنا):");
    if (!url) return;
    const alt = window.prompt("النص البديل للصورة (مهم لإتاحة الوصول وSEO):") ?? "";
    editor!.chain().focus().setImage({ src: url, alt }).run();
  }

  function addTable() {
    editor!.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function toggleCallout() {
    if (editor!.isActive("calloutNote")) {
      editor!.chain().focus().lift("calloutNote").run();
    } else {
      editor!.chain().focus().wrapIn("calloutNote").run();
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-100 bg-gray-50">
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="غامق">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="مائل">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="عنوان H2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="عنوان H3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="قائمة نقطية">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="قائمة مرقمة">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="اقتباس">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("calloutNote")} onClick={toggleCallout} title="ملاحظة طبية">
          <StickyNote className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton active={editor.isActive("link")} onClick={addLink} title="إضافة رابط">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        {editor.isActive("link") && (
          <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="إزالة الرابط">
            <Link2Off className="w-4 h-4" />
          </ToolbarButton>
        )}
        <ToolbarButton onClick={addImage} title="إضافة صورة">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addTable} title="إضافة جدول">
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="تراجع">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="إعادة">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${
        active ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-gray-200 mx-1" />;
}
