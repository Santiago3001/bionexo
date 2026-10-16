"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Role, useStore } from "@/lib/store";
import ModeloNegocioModal from "./ModeloNegocioModal";

const NAVS: Record<Role, [string, string][]> = {
  comprador: [["/comprador/requerimiento", "Requerimiento"], ["/comprador/subproducto", "Mi subproducto"], ["/comprador/agente", "Agente IA"], ["/comprador/seguimiento", "Seguimiento"], ["/comprador/sostenibilidad", "Sostenibilidad"], ["/perfil", "Perfil"]],
  vendedor: [["/vendedor/publicaciones", "Mis publicaciones"], ["/vendedor/publicar", "Publicar subproducto"], ["/vendedor/cotizador", "Cotizador"], ["/vendedor/seguimiento", "Seguimiento"], ["/vendedor/impacto", "Reporte de impacto"], ["/perfil", "Perfil"]],
  transportista: [["/transportista/mapa", "Mapa de cargas y rutas"], ["/perfil", "Perfil"]],
};

function initials(name: string) {
  return (name || "BN").split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
}

export function Shell({ children }: { children: ReactNode }) {
  const { user, role, setRole, logout } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [openNegocio, setOpenNegocio] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) router.replace("/");
  }, [user, router]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <p>Necesitás iniciar sesión (mock). <Link href="/">Ir al login</Link></p>
      </div>
    );
  }

  const empresaActive = role === "comprador" || role === "vendedor";

  const goEmpresa = () => {
    setRole("comprador");
    router.push("/comprador/requerimiento");
    setOpen(false);
  };
  const goTransportista = () => {
    setRole("transportista");
    router.push("/transportista/mapa");
    setOpen(false);
  };
  const goNegocio = () => {
    setOpenNegocio(true);
    setOpen(false);
  };
  const doLogout = () => {
    logout();
    router.replace("/");
    setOpen(false);
  };

  return (
    <div>
      <header className="bn-navbar" style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={role === "transportista" ? "/transportista/mapa" : role === "vendedor" ? "/vendedor/publicaciones" : "/comprador/requerimiento"} style={{ color: "var(--color-foreground)", textDecoration: "none", fontSize: 21, fontWeight: 600, fontFamily: "var(--font-heading)" }}>BioNexo NEA</Link>
          <div style={{ color: "var(--color-muted-fg)", fontSize: 12 }}>Conectamos lo que producís con quien lo necesita · demo simulada</div>
        </div>

        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span aria-hidden="true" style={{ display: "inline-flex", width: 38, height: 38, borderRadius: "50%", background: "var(--gradient-nature)", color: "#fff", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {initials(user.name)}
          </span>
          <span style={{ lineHeight: 1.25, minWidth: 0 }}>
            <strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--color-foreground)" }}>{user.company}</strong>
            <small style={{ color: "var(--color-muted-fg)" }}>{user.city}</small>
          </span>
        </span>

        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="bn-mode-btn"
            data-open={open}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            Cambiar de modo
            <span aria-hidden="true" style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform 180ms ease", fontSize: 12 }}>▾</span>
          </button>

          {open && (
            <div role="menu" aria-label="Cambiar de modo" style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", background: "var(--color-card)", color: "var(--color-foreground)", borderRadius: 24, minWidth: 320, maxWidth: "calc(100vw - 40px)", boxShadow: "var(--shadow-menu)", border: "1px solid var(--color-border)", padding: 8, zIndex: 60 }}>
              <button type="button" role="menuitem" onClick={goEmpresa} className="bn-menu-item" style={{ display: "block", width: "100%", textAlign: "left", border: 0, cursor: "pointer", padding: "11px 14px", background: empresaActive ? "#228b221a" : "transparent" }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 15, color: "var(--color-foreground)" }}>Comprar / Vender subproductos</span>
                <span style={{ display: "block", fontSize: 13, color: "var(--color-muted-fg)", marginTop: 2 }}>Modo empresa: publicás excedentes y comprás insumos</span>
              </button>
              <button type="button" role="menuitem" onClick={goTransportista} className="bn-menu-item" style={{ display: "block", width: "100%", textAlign: "left", border: 0, cursor: "pointer", padding: "11px 14px", background: role === "transportista" ? "#228b221a" : "transparent", marginTop: 2 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 15, color: "var(--color-foreground)" }}>Transportista</span>
                <span style={{ display: "block", fontSize: 13, color: "var(--color-muted-fg)", marginTop: 2 }}>Mapa de cargas y rutas rentables</span>
              </button>
              <button type="button" role="menuitem" onClick={goNegocio} className="bn-menu-item" style={{ display: "block", width: "100%", textAlign: "left", border: 0, cursor: "pointer", padding: "11px 14px", background: path === "/negocio" ? "#228b221a" : "transparent", marginTop: 2 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 15, color: "var(--color-foreground)" }}>Modelo de negocio</span>
                <span style={{ display: "block", fontSize: 13, color: "var(--color-muted-fg)", marginTop: 2 }}>Proyección para el pitch</span>
              </button>
              <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 6, paddingTop: 6 }}>
                <button type="button" role="menuitem" onClick={doLogout} className="bn-menu-item" style={{ display: "block", width: "100%", textAlign: "left", border: 0, cursor: "pointer", padding: "11px 14px", background: "transparent", fontWeight: 600, fontSize: 15, color: "var(--color-foreground)" }}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div aria-label="Selector de modo" style={{ background: "var(--color-card)", borderBottom: "1px solid var(--color-border)", padding: "12px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        {role === "transportista" ? (
          <span className="bn-badge" style={{ background: "#8b45131a", color: "var(--color-accent)" }}>Modo transportista</span>
        ) : (
          <>
            <span role="group" aria-label="Elegí si querés comprar o vender" style={{ display: "inline-flex", background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: 50, padding: 4, gap: 2 }}>
              <button
                type="button"
                aria-pressed={role === "comprador"}
                onClick={() => { setRole("comprador"); router.push("/comprador/requerimiento"); }}
                style={{ border: 0, borderRadius: 50, padding: "9px 28px", background: role === "comprador" ? "var(--gradient-nature)" : "transparent", color: role === "comprador" ? "#fff" : "var(--color-muted-fg)", fontWeight: 600, cursor: "pointer", transition: "all 180ms ease" }}
              >
                Comprar
              </button>
              <button
                type="button"
                aria-pressed={role === "vendedor"}
                onClick={() => { setRole("vendedor"); router.push("/vendedor/publicaciones"); }}
                style={{ border: 0, borderRadius: 50, padding: "9px 28px", background: role === "vendedor" ? "var(--gradient-nature)" : "transparent", color: role === "vendedor" ? "#fff" : "var(--color-muted-fg)", fontWeight: 600, cursor: "pointer", transition: "all 180ms ease" }}
              >
                Vender
              </button>
            </span>
            <span aria-live="polite" style={{ fontSize: 13, color: "var(--color-muted-fg)" }}>
              {role === "comprador" ? "Estás comprando: cargá lo que necesitás y encontrá proveedores." : "Estás vendiendo: publicá tus excedentes y recibí compradores."}
            </span>
          </>
        )}
      </div>

      <nav aria-label="Secciones del modo actual" style={{ display: "flex", gap: 8, padding: "10px 20px", background: "var(--color-card)", borderBottom: "1px solid var(--color-border)", flexWrap: "wrap", alignItems: "center" }}>
        {NAVS[role].map(([href, label]) => {
          const active = path === href;
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className="bn-tab" style={{ background: active ? "var(--color-bg-dark)" : "transparent", color: active ? "#fff" : "var(--color-muted-fg)", borderRadius: 50, padding: "9px 16px", fontWeight: 600, textDecoration: "none" }}>{label}</Link>
          );
        })}
      </nav>

      <main style={{ padding: "24px 20px", maxWidth: 1200, margin: "auto", width: "100%" }}>{children}</main>

      <ModeloNegocioModal open={openNegocio} onClose={() => setOpenNegocio(false)} />
    </div>
  );
}
