"use client";

import { Share2 } from "lucide-react";

type ShareButtonProps = {
  title: string;
};

export function ShareButton({ title }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="rounded-full p-2 transition-colors"
      style={{
        backgroundColor: "var(--template-bg-secondary)",
        color: "var(--template-text-secondary)",
      }}
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}
