"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { EditorMenuBar } from "./editor-menu-bar";

type RichTextEditorProps = {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
};

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "記事の本文を入力してください...",
  maxLength = 50000,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 hover:underline",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none focus:outline-none min-h-[300px] px-4 py-3",
      },
    },
  });

  if (!editor) {
    return (
      <div className="rounded-lg border border-surface-200 bg-white">
        <div className="h-12 border-b border-surface-200 bg-surface-50" />
        <div className="min-h-[300px] animate-pulse bg-surface-50" />
      </div>
    );
  }

  const characterCount = editor.storage.characterCount.characters();
  const characterPercentage = Math.round((characterCount / maxLength) * 100);

  return (
    <div className="rounded-lg border border-surface-200 bg-white">
      <EditorMenuBar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-surface-200 px-4 py-2 text-xs text-surface-500">
        <span>
          {characterCount.toLocaleString()} / {maxLength.toLocaleString()} 文字
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-200">
            <div
              className={`h-full transition-all ${
                characterPercentage > 90
                  ? "bg-red-500"
                  : characterPercentage > 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(characterPercentage, 100)}%` }}
            />
          </div>
          <span>{characterPercentage}%</span>
        </div>
      </div>
    </div>
  );
}
