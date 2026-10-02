"use client";

import { useState } from "react";
import { SHARE_LABEL, SHARE_VILLAGE_ENABLED, sharePreview, type ShareFacts } from "@/features/share-village/share-village";

export function ShareVillage(props: { facts: ShareFacts }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!SHARE_VILLAGE_ENABLED) return null;
  const card = sharePreview(props.facts);

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
    <div className="share-village-slot">
      <button
        type="button"
        className="share-village"
        data-testid="share-village"
        data-module="share-village"
        aria-expanded={open}
        onClick={() => {
          setCopied(false);
          setOpen((value) => !value);
        }}
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
            <button type="button" className="hud-icon" aria-label="收起" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
