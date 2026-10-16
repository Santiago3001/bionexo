"use client";

const META: Record<string, { emoji: string; gradient: string; tagline: string }> = {
  "Cascarilla de arroz": { emoji: "🌾", gradient: "linear-gradient(135deg,#fbbf24,#65a30d)", tagline: "Biomasa agrícola" },
  "Aserrín de pino": { emoji: "🪵", gradient: "linear-gradient(135deg,#b45309,#fcd34d)", tagline: "Forestal" },
  "Bagazo de caña": { emoji: "🎋", gradient: "linear-gradient(135deg,#16a34a,#a3e635)", tagline: "Ingenio azucarero" },
  "Residuo de yerba": { emoji: "🧉", gradient: "linear-gradient(135deg,#15803d,#facc15)", tagline: "Yerbatera" },
  "Afrechillo de trigo": { emoji: "🌽", gradient: "linear-gradient(135deg,#d97706,#fef08a)", tagline: "Molino" },
  "Viruta de madera dura": { emoji: "🪚", gradient: "linear-gradient(135deg,#78350f,#d6a35c)", tagline: "Carpintería" },
};

const FALLBACK = { emoji: "♻️", gradient: "linear-gradient(135deg,#228b22,#87ceeb)", tagline: "Subproducto" };

export function productMeta(product: string) {
  return META[product] ?? FALLBACK;
}

export default function ProductImage({ product, height = 160 }: { product: string; height?: number }) {
  const meta = productMeta(product);
  return (
    <div
      aria-hidden="true"
      style={{
        height,
        background: meta.gradient,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        borderRadius: "16px 16px 0 0",
      }}
    >
      <span style={{ fontSize: 56, lineHeight: 1 }}>{meta.emoji}</span>
      <span style={{ background: "#00000055", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 50, padding: "3px 10px", letterSpacing: ".04em", textTransform: "uppercase" }}>
        {meta.tagline}
      </span>
    </div>
  );
}
