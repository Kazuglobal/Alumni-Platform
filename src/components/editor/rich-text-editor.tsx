"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useCallback, useState } from "react";
import { EditorMenuBar } from "./editor-menu-bar";

type RichTextEditorProps = {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  tenantId?: string;
};

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "記事の本文を入力してください...",
  maxLength = 50000,
  disabled = false,
  tenantId,
}: RichTextEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      if (!tenantId) {
        setUploadError("テナントIDが設定されていません");
        return null;
      }

      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          setUploadError(error.error || "アップロードに失敗しました");
          return null;
        }

        const data = await res.json();
        return data.url;
      } catch {
        setUploadError("アップロードに失敗しました");
        return null;
      }
    },
    [tenantId]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (!tenantId || !editor) return;

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((f) => f.type.startsWith("image/"));

      if (imageFile) {
        const url = await uploadImage(imageFile);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    },
    [editor, tenantId, uploadImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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
    <div
      className={`relative rounded-lg border bg-white transition-colors ${
        isDragging
          ? "border-brand-500 bg-brand-50"
          : "border-surface-200"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-brand-50/80">
          <div className="text-center">
            <div className="mb-2 text-4xl">📷</div>
            <p className="font-medium text-brand-700">画像をドロップしてアップロード</p>
          </div>
        </div>
      )}
      <EditorMenuBar
        editor={editor}
        disabled={disabled}
        tenantId={tenantId}
        onImageUpload={tenantId ? uploadImage : undefined}
      />
      <EditorContent editor={editor} />
      {uploadError && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {uploadError}
        </div>
      )}
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
