"use client";

const META: Record<string, { emoji: string; gradient: string; tagline: string }> = {
  "Cascarilla de arroz": { emoji: "🌾", gradient: "linear-gradient(135deg,#fbbf24,#65a30d)", tagline: "Biomasa agrícola" },
  "Aserrín de pino": { emoji: "🪵", gradient: "linear-gradient(135deg,#b45309,#fcd34d)", tagline: "Forestal" },
  "Bagazo de caña": { emoji: "🎋", gradient: "linear-gradient(135deg,#16a34a,#a3e635)", tagline: "Ingenio azucarero" },
  "Residuo de yerba": { emoji: "🧉", gradient: "linear-gradient(135deg,#15803d,#facc15)", tagline: "Yerbatera" },
  "Afrechillo de trigo": { emoji: "🌽", gradient: "linear-gradient(135deg,#d97706,#fef08a)", tagline: "Molino" },
  "Viruta de madera dura": { emoji: "🪚", gradient: "linear-gradient(135deg,#78350f,#d6a35c)", tagline: "Carpintería" },
  "Cáscara de tung": { emoji: "🌰", gradient: "linear-gradient(135deg,#8b5cf6,#a78bfa)", tagline: "Procesos extractivos" },
  "Cáscara de algodón": { emoji: "🪡", gradient: "linear-gradient(135deg,#3b82f6,#60a5fa)", tagline: "Agronegocio" },
  "Fibra / Carpelo de algodón": { emoji: "🧵", gradient: "linear-gradient(135deg,#f97316,#fb923c)", tagline: "Textil / Agrícola" },
  "Harina de algodón": { emoji: "🍞", gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)", tagline: "Alimentación animal" },
  "Polvo de lijado de pino/eucalipto": { emoji: "✨", gradient: "linear-gradient(135deg,#4b5563,#9ca3af)", tagline: "Maderero" },
  "Corteza de pino / eucalipto": { emoji: "🌳", gradient: "linear-gradient(135deg,#451a03,#7c2d12)", tagline: "Forestal" },
  "Cáscara de citricos": { emoji: "🍊", gradient: "linear-gradient(135deg,#ef4444,#f87171)", tagline: "Agroindustrial" },

  "Pellet de cascarilla de arroz": { emoji: "🌾", gradient: "linear-gradient(135deg,#a855f7,#d946ef)", tagline: "Biomasa densificada" },
  "Pellet de madera / biomasa": { emoji: "🪵", gradient: "linear-gradient(135deg,#8b5cf6,#7c3aed)", tagline: "Biomasa densificada" },
  "Pellet de alfalfa": { emoji: "🌱", gradient: "linear-gradient(135deg,#22c55e,#10b981)", tagline: "Forraje densificado" },
  "Pellet de cáscara de girasol": { emoji: "🌻", gradient: "linear-gradient(135deg,#fbbf24,#eab308)", tagline: "Biomasa densificada" },
  "Pellet de afrechillo de trigo": { emoji: "🌽", gradient: "linear-gradient(135deg,#f97316,#ea580c)", tagline: "Alimentación animal" },
  "Pellet de soja": { emoji: " soja", gradient: "linear-gradient(135deg,#4338ca,#3730a3)", tagline: "Alimentación animal" },

  "Cáscara de maní": { emoji: "🥜", gradient: "linear-gradient(135deg,#f97316,#ea580c)", tagline: "Agronegocio" },
  "Cáscara de girasol": { emoji: "🌻", gradient: "linear-gradient(135deg,#f59e0b,#d97706)", tagline: "Agronegocio" },
  "Expeller de soja": { emoji: "📦", gradient: "linear-gradient(135deg,#fbbf24,#f59e0b)", tagline: "Alimentación animal" },
  "Expeller de girasol": { emoji: "📦", gradient: "linear-gradient(135deg,#eab308,#f59e0b)", tagline: "Alimentación animal" },
  "Afrecho de maíz": { emoji: "🌽", gradient: "linear-gradient(135deg,#f59e0b,#d97706)", tagline: "Molino" },
  "Marlo / Rastrojo de maíz": { emoji: "🌽", gradient: "linear-gradient(135deg,#fbbf24,#d97706)", tagline: "Agronegocio" },
  "Burlanda de maíz (DDGS seca / húmeda)": { emoji: "🌾", gradient: "linear-gradient(135deg,#f59e0b,#d97706)", tagline: "Alimentación animal" },
  "Orujo de uva seco": { emoji: "🍇", gradient: "linear-gradient(135deg,#a855f7,#d946ef)", tagline: "Vitivinícola" },
  "Escobajo de uva": { emoji: "🌿", gradient: "linear-gradient(135deg,#22c55e,#10b981)", tagline: "Vitivinícola" },

  "Malaza de caña de azúcar": { emoji: "🌾", gradient: "linear-gradient(135deg,#16a34a,#a3e635)", tagline: "Ingenio azucarero" },
  "Orujo / Orujillo de oliva": { emoji: "🫒", gradient: "linear-gradient(135deg,#fbbf24,#f59e0b)", tagline: "Olivícola" },
  "Carozo de durazno / ciruela": { emoji: "🍑", gradient: "linear-gradient(135deg,#f43f5e,#ec4899)", tagline: "Agroindustrial" },
  "Pulpas de frutas (manzana/pera)": { emoji: "🍎", gradient: "linear-gradient(135deg,#f87171,#ef4444)", tagline: "Agroindustrial" },
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
