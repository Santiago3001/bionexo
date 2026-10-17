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

/** Etiqueta chica para marcar datos o módulos de demostración. */
export function DemoTag() {
  return (
    <span
      title="Datos de demostración"
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: ".06em",
        textTransform: "uppercase",
        color: "#92400e",
        background: "#fef3c7",
        border: "1px solid #fde68a",
        verticalAlign: "middle",
      }}
    >
      Demo
    </span>
  );
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

export function Modal({ open, onClose, children, maxWidth = 680 }: { open: boolean; onClose: () => void; children: ReactNode; maxWidth?: number | string }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#1b4332b3", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ background: "#fff", borderRadius: 24, maxWidth, width: "100%", padding: 24, maxHeight: "90vh", overflow: "auto", boxShadow: "var(--shadow-menu)" }}>
        {children}
      </div>
    </div>
  );
}

