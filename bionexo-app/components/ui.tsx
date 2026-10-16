"use client";
import { ReactNode } from "react";

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="bn-card" style={{ padding: 24, marginBottom: 16, ...style }}>
      {children}
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="bn-badge">{children}</span>;
}

export function TruequeTag() {
  return <span style={{ display: "inline-block", background: "var(--gradient-earth)", color: "#fff", borderRadius: 50, padding: "4px 12px", fontSize: 12, fontWeight: 700, letterSpacing: ".02em" }}>TRUEQUE POSIBLE</span>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <span style={{ color: "var(--color-muted-fg)", fontSize: 13 }}>{children}</span>;
}

export function Steps({ items, current }: { items: string[]; current: number }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
      {items.map((s, i) => (
        <span key={s} style={{ padding: "6px 12px", borderRadius: 50, fontSize: 12, fontWeight: 600, background: i < current ? "var(--color-primary)" : i === current ? "var(--color-bg-dark)" : "var(--color-bg-alt)", color: i <= current ? "#fff" : "var(--color-muted-fg)" }}>
          {i + 1}. {s}
        </span>
      ))}
    </div>
  );
}

export function Btn({ children, onClick, kind, disabled }: { children: ReactNode; onClick?: () => void; kind?: "sec" | "warn" | "ghost"; disabled?: boolean }) {
  const cls = kind === "sec" ? "bn-btn bn-btn--sec" : kind === "warn" ? "bn-btn bn-btn--warn" : kind === "ghost" ? "bn-btn bn-btn--ghost" : "bn-btn";
  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#1b4332b3", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ background: "#fff", borderRadius: 24, maxWidth: 680, width: "100%", padding: 24, maxHeight: "90vh", overflow: "auto", boxShadow: "var(--shadow-menu)" }}>
        {children}
      </div>
    </div>
  );
}
