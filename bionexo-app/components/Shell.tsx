"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { homeForRole, type Role, useStore } from "@/lib/store";
import ModeloNegocioModal from "./ModeloNegocioModal";

const NAVS: Record<Role, [string, string][]> = {
  comprador: [
    ["/comprador/requerimiento", "Requerimiento"],
    ["/comprador/subproducto", "Material disponible"],
    ["/comprador/agente", "Agente IA"],
    ["/comprador/seguimiento", "Seguimiento"],
    ["/comprador/sostenibilidad", "Sostenibilidad"],
    ["/perfil", "Perfil"],
  ],
  vendedor: [
    ["/vendedor/publicaciones", "Mis publicaciones"],
    ["/vendedor/publicar", "Publicar subproducto"],
    ["/vendedor/cotizador", "Cotizador"],
    ["/vendedor/seguimiento", "Seguimiento"],
    ["/vendedor/impacto", "Reporte de impacto"],
    ["/perfil", "Perfil"],
  ],
  transportista: [
    ["/transportista/mapa", "Mapa de cargas y rutas"],
    ["/perfil", "Perfil"],
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  comprador: "Comprador",
  vendedor: "Vendedor",
  transportista: "Transportista",
};

function initials(name: string) {
  return (name || "BN").split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function routeAllowed(role: Role, path: string) {
  if (path === "/perfil" || path === "/negocio") return true;
  return path.startsWith(`/${role}`);
}

export function Shell({ children }: { children: ReactNode }) {
  const { user, role, authLoading, dataLoading, logout } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [businessOpen, setBusinessOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (!routeAllowed(user.role, path)) router.replace(homeForRole(user.role));
  }, [authLoading, user, path, router]);

  async function closeSession() {
    await logout();
    router.replace("/");
  }

  if (authLoading || dataLoading) {
    return <main style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}><p>Cargando tu espacio BioNexo…</p></main>;
  }

  if (!user) return null;

  return (
    <div>
      <header className="bn-navbar" style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Link href={homeForRole(role)} style={{ color: "var(--color-foreground)", textDecoration: "none", fontSize: 21, fontWeight: 600, fontFamily: "var(--font-heading)" }}>BioNexo NEA</Link>
          <div style={{ color: "var(--color-muted-fg)", fontSize: 12 }}>Conectamos lo que producís con quien lo necesita</div>
        </div>

        <span className="bn-badge">Modo {ROLE_LABEL[role]}</span>

        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span aria-hidden="true" style={{ display: "inline-flex", width: 38, height: 38, borderRadius: "50%", background: "var(--gradient-nature)", color: "#fff", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{initials(user.name)}</span>
          <span style={{ lineHeight: 1.25, minWidth: 0 }}>
            <strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.company}</strong>
            <small style={{ color: "var(--color-muted-fg)" }}>{user.city}</small>
          </span>
        </span>

        <button type="button" className="bn-mode-btn" onClick={() => setBusinessOpen(true)}>Modelo de negocio</button>
        <button type="button" className="bn-mode-btn" onClick={() => void closeSession()}>Cerrar sesión</button>
      </header>

      <nav aria-label="Secciones del usuario" style={{ display: "flex", gap: 8, padding: "10px 20px", background: "var(--color-card)", borderBottom: "1px solid var(--color-border)", flexWrap: "wrap", alignItems: "center" }}>
        {NAVS[role].map(([href, label]) => {
          const active = path === href;
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className="bn-tab" style={{ background: active ? "var(--color-bg-dark)" : "transparent", color: active ? "#fff" : "var(--color-muted-fg)", borderRadius: 50, padding: "9px 16px", fontWeight: 600, textDecoration: "none" }}>{label}</Link>;
        })}
      </nav>

      <main style={{ padding: "24px 20px", maxWidth: 1200, margin: "auto", width: "100%" }}>{children}</main>
      <ModeloNegocioModal open={businessOpen} onClose={() => setBusinessOpen(false)} />
    </div>
  );
}
