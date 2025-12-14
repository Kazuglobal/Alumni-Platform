"use client";

import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Unlink,
} from "lucide-react";
import { useCallback, useState } from "react";

type EditorMenuBarProps = {
  editor: Editor;
  disabled?: boolean;
};

type MenuButtonProps = {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
};

function MenuButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        isActive
          ? "bg-surface-200 text-surface-900"
          : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="mx-1 h-6 w-px bg-surface-200" />;
}

export function EditorMenuBar({ editor, disabled }: EditorMenuBarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const setLink = useCallback(() => {
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }

    // Add https if missing
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().setLink({ href: url }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!imageUrl) {
      setShowImageInput(false);
      return;
    }

    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl("");
    setShowImageInput(false);
  }, [editor, imageUrl]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-surface-200 bg-surface-50 px-2 py-1.5">
      {/* Text formatting */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        disabled={disabled}
        title="太字 (Ctrl+B)"
      >
        <Bold size={16} />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        disabled={disabled}
        title="斜体 (Ctrl+I)"
      >
        <Italic size={16} />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        disabled={disabled}
        title="取り消し線"
      >
        <Strikethrough size={16} />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        disabled={disabled}
        title="インラインコード"
      >
        <Code size={16} />
      </MenuButton>

      <MenuDivider />

      {/* Headings */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        disabled={disabled}
        title="見出し1"
      >
        <Heading1 size={16} />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        title="見出し2"
      >
        <Heading2 size={16} />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        title="見出し3"
      >
        <Heading3 size={16} />
      </MenuButton>

      <MenuDivider />

      {/* Lists */}
      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        disabled={disabled}
        title="箇条書きリスト"
      >
        <List size={16} />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        disabled={disabled}
        title="番号付きリスト"
      >
        <ListOrdered size={16} />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        disabled={disabled}
        title="引用"
      >
        <Quote size={16} />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={disabled}
        title="水平線"
      >
        <Minus size={16} />
      </MenuButton>

      <MenuDivider />

      {/* Link */}
      {showLinkInput ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="URLを入力"
            className="h-7 w-40 rounded border border-surface-300 px-2 text-xs focus:border-brand-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setLink();
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
                setLinkUrl("");
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={setLink}
            className="rounded bg-brand-500 px-2 py-1 text-xs text-white hover:bg-brand-600"
          >
            追加
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            className="rounded px-2 py-1 text-xs text-surface-600 hover:bg-surface-100"
          >
            取消
          </button>
        </div>
      ) : (
        <>
          <MenuButton
            onClick={() => setShowLinkInput(true)}
            isActive={editor.isActive("link")}
            disabled={disabled}
            title="リンク"
          >
            <LinkIcon size={16} />
          </MenuButton>
          {editor.isActive("link") && (
            <MenuButton
              onClick={() => editor.chain().focus().unsetLink().run()}
              disabled={disabled}
              title="リンク解除"
            >
              <Unlink size={16} />
            </MenuButton>
          )}
        </>
      )}

      {/* Image */}
      {showImageInput ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="画像URLを入力"
            className="h-7 w-48 rounded border border-surface-300 px-2 text-xs focus:border-brand-500 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImage();
              } else if (e.key === "Escape") {
                setShowImageInput(false);
                setImageUrl("");
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={addImage}
            className="rounded bg-brand-500 px-2 py-1 text-xs text-white hover:bg-brand-600"
          >
            追加
          </button>
          <button
            type="button"
            onClick={() => {
              setShowImageInput(false);
              setImageUrl("");
            }}
            className="rounded px-2 py-1 text-xs text-surface-600 hover:bg-surface-100"
          >
            取消
          </button>
        </div>
      ) : (
        <MenuButton
          onClick={() => setShowImageInput(true)}
          disabled={disabled}
          title="画像"
        >
          <ImageIcon size={16} />
        </MenuButton>
      )}

      <div className="flex-1" />

      {/* Undo/Redo */}
      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title="元に戻す (Ctrl+Z)"
      >
        <Undo size={16} />
      </MenuButton>
      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title="やり直す (Ctrl+Y)"
      >
        <Redo size={16} />
      </MenuButton>
    </div>
  );
}
