"use client";

import { useState } from "react";
import { SHARE_LABEL, SHARE_VILLAGE_ENABLED, sharePreview, type ShareFacts } from "@/features/share-village/share-village";

export function ShareVillage(props: { facts: ShareFacts; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!SHARE_VILLAGE_ENABLED) return null;
  const card = sharePreview(props.facts);

  function setShareOpen(next: boolean) {
    setCopied(false);
    setOpen(next);
    props.onOpenChange?.(next);
  }

  async function copyCard() {
    const link = typeof window === "undefined" ? "" : window.location.origin;
    const text = link ? `${card.text}\n${link}` : card.text;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    const link = typeof window === "undefined" ? "" : window.location.origin;
    const nav = navigator as Navigator & { share?: (data: { title: string; text: string; url?: string }) => Promise<void> };
    if (!nav.share) {
      await copyCard();
      return;
    }
    try {
      await nav.share({ title: card.title, text: card.text, url: link || undefined });
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="share-village-slot" data-sentence-strip="1">
      <button
        type="button"
        className="share-village"
        data-testid="share-village"
        data-module="share-village"
        data-open={open ? "1" : "0"}
        aria-expanded={open}
        onClick={() => setShareOpen(!open)}
      >
        {SHARE_LABEL}
      </button>
      {open ? (
        <div className="share-preview" data-testid="share-preview" role="dialog" aria-label={SHARE_LABEL}>
          {card.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <div className="share-preview-actions">
            <button type="button" className="hud-btn hud-btn-ghost" onClick={() => void nativeShare()}>
              发给朋友
            </button>
            <button type="button" className="hud-btn hud-btn-ghost" onClick={() => void copyCard()}>
              {copied ? "已复制" : "复制"}
            </button>
            <button type="button" className="hud-icon" aria-label="收起" onClick={() => setShareOpen(false)}>
              ×
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
