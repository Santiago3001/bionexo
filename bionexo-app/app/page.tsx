"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CITIES } from "@/lib/data";
import { homeForRole, type RegisterInput, type Role, useStore } from "@/lib/store";
import { Btn } from "@/components/ui";
import CotizacionBolsaModal from "@/components/CotizacionBolsaModal";

const EMPTY_REGISTER: RegisterInput = {
  name: "",
  company: "",
  cuit: "",
  city: "Resistencia",
  email: "",
  password: "",
  businessType: "",
  role: "comprador",
};

const DEMO_PASSWORD = "Bionexo2026!";

const DEMO_USERS: { email: string; label: string; desc: string; icon: string; role: Role }[] = [
  { email: "demo.comprador@bionexo.dev", label: "Comprador", desc: "compra, matching, contrato, reportes", icon: "🛒", role: "comprador" },
  { email: "demo.vendedor@bionexo.dev", label: "Vendedor", desc: "publica ofertas, cotizador, impacto", icon: "🏭", role: "vendedor" },
  { email: "demo.transportista@bionexo.dev", label: "Transportista", desc: "mapa de rutas y retornos", icon: "🚚", role: "transportista" },
];

// Alianzas institucionales y comerciales (DEMO): no representan convenios reales.
const ALIANZAS: { icon: string; nombre: string }[] = [
  { icon: "🌾", nombre: "Arrocera El Sauce" },
  { icon: "🪵", nombre: "Aserradero Litoral" },
  { icon: "🎋", nombre: "Ingenio Cañero Chaco" },
  { icon: "🧉", nombre: "Yerbatera Misiones" },
  { icon: "🌽", nombre: "Molino del Norte" },
  { icon: "🪚", nombre: "Carpintería Reconquista" },
  { icon: "🤝", nombre: "Cooperativa Agropecuaria NEA" },
  { icon: "🏛️", nombre: "Cámara de Comercio del NEA" },
  { icon: "🌲", nombre: "Clúster de la Madera" },
  { icon: "🔬", nombre: "INTA" },
  { icon: "🎓", nombre: "UNNE" },
  { icon: "🏢", nombre: "Secretaría de Producción" },
];

export default function Home() {
  const { user, authLoading, authConfigured, signIn, signUp } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState<RegisterInput>(EMPTY_REGISTER);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [bolsaOpen, setBolsaOpen] = useState(false);

  useEffect(() => {
    if (user) router.replace(homeForRole(user.role));
  }, [user, router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    setMessage(result.message);
    setIsError(!result.ok);
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await signUp(register);
    setSubmitting(false);
    setMessage(result.message);
    setIsError(!result.ok);
    if (result.ok && result.requiresEmailConfirmation) setMode("login");
  }

  if (authLoading || user) {
    return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><p>Preparando BioNexo…</p></main>;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="bn-navbar" style={{ padding: "8px 20px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1120, margin: "auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 21, fontWeight: 600, color: "var(--color-foreground)" }}>BioNexo NEA</span>
          <small style={{ color: "var(--color-muted-fg)" }}>Conectamos lo que producís con quien lo necesita</small>
          <button type="button" className="bn-btn bn-btn--sec" style={{ marginLeft: "auto", padding: "7px 16px", fontSize: 13 }} onClick={() => setBolsaOpen(true)}>
            📈 Cotización en la bolsa
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1120, width: "100%", margin: "auto", padding: "0 20px 92px", flex: 1, display: "flex", flexDirection: "column" }}>
        <section
          style={{
            padding: "16px 0 10px",
            display: "grid",
            gap: "clamp(18px,3vw,40px)",
            gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))",
            alignItems: "center",
          }}
        >
          <div>
            <span className="bn-badge" style={{ marginBottom: 10 }}>🌱 Economía circular para el NEA</span>
            <h1 style={{ margin: "0 0 10px", fontSize: "clamp(1.6rem,3vw,2.3rem)", lineHeight: 1.1, maxWidth: 600 }}>
              Convertí tus <span className="bn-gradient-text">excedentes</span> en insumos para otra empresa.
            </h1>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-muted-fg)", maxWidth: 540 }}>
              Publicá o encontrá subproductos, acordá condiciones y coordiná el transporte en un solo lugar. Tres roles, una misma operación.
            </p>
          </div>

          <div id="acceso" className="bn-card" style={{ padding: "clamp(16px,2.2vw,20px)", scrollMarginTop: 80 }}>
            <div role="tablist" aria-label="Acceso" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button className="bn-mode-btn" data-open={mode === "login"} role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setMessage(""); }}>Iniciar sesión</button>
              <button className="bn-mode-btn" data-open={mode === "register"} role="tab" aria-selected={mode === "register"} onClick={() => { setMode("register"); setMessage(""); }}>Crear cuenta</button>
            </div>

            {!authConfigured && (
              <div style={{ background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412", borderRadius: 12, padding: 10, marginBottom: 12, fontSize: 13 }}>
                Falta configurar Supabase. Copiá <code>.env.example</code> como <code>.env.local</code> y agregá la URL y la clave pública del proyecto.
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin}>
                <h2 style={{ margin: "0 0 3px", fontSize: "1.2rem" }}>Ingresá a tu cuenta</h2>
                <p style={{ margin: "0 0 10px", color: "var(--color-muted-fg)", fontSize: 13 }}>Tu perfil determina las pantallas disponibles.</p>

                <div style={{ background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 10, marginBottom: 12 }}>
                  <strong style={{ fontSize: 12.5 }}>⚡ Acceso rápido demo</strong>
                  <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(3,1fr)", marginTop: 6 }}>
                    {DEMO_USERS.map((demo) => {
                      const active = email === demo.email && password === DEMO_PASSWORD;
                      return (
                        <button
                          key={demo.email}
                          type="button"
                          title={demo.desc}
                          onClick={() => { setEmail(demo.email); setPassword(DEMO_PASSWORD); setMessage(""); }}
                          aria-pressed={active}
                          style={{
                            textAlign: "center",
                            borderRadius: 12,
                            padding: "6px 4px",
                            border: active ? "2px solid var(--color-primary)" : "2px solid var(--color-border)",
                            background: active ? "#fff" : "var(--color-card)",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontSize: 16 }}>{demo.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: 12.5, marginTop: 2 }}>{demo.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  <small style={{ color: "var(--color-muted-fg)", fontSize: 11.5 }}>Tocá un perfil y pulsá Iniciar sesión. Contraseña precargada.</small>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <label style={{ display: "grid", gap: 4 }}><strong style={{ fontSize: 13 }}>Email</strong><input className="bn-input" style={{ padding: "9px 14px" }} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                  <label style={{ display: "grid", gap: 4 }}><strong style={{ fontSize: 13 }}>Contraseña</strong><input className="bn-input" style={{ padding: "9px 14px" }} type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                  <div style={{ marginTop: -6, textAlign: "right" }}>
                    <Link href="/reset-password" style={{ fontSize: 12.5, color: "var(--color-primary)", fontWeight: 600 }}>¿Olvidaste tu contraseña?</Link>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}><Btn disabled={submitting || !authConfigured}>{submitting ? "Ingresando…" : "Iniciar sesión"}</Btn></div>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <h2 style={{ margin: "0 0 4px", fontSize: "1.35rem" }}>Creá tu perfil BioNexo</h2>
                <p style={{ margin: "0 0 14px", color: "var(--color-muted-fg)", fontSize: 13.5 }}>Elegí el rol principal. Los permisos también se controlan en la base de datos.</p>
                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                  <label style={{ display: "grid", gap: 5 }}><strong style={{ fontSize: 13.5 }}>Nombre y apellido</strong><input className="bn-input" style={{ padding: "10px 14px" }} required value={register.name} onChange={(event) => setRegister({ ...register, name: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 5 }}><strong style={{ fontSize: 13.5 }}>Empresa / razón social</strong><input className="bn-input" style={{ padding: "10px 14px" }} required value={register.company} onChange={(event) => setRegister({ ...register, company: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 5 }}><strong style={{ fontSize: 13.5 }}>CUIT</strong><input className="bn-input" style={{ padding: "10px 14px" }} required value={register.cuit} onChange={(event) => setRegister({ ...register, cuit: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 5 }}><strong style={{ fontSize: 13.5 }}>Ciudad</strong><select className="bn-input" style={{ padding: "10px 14px" }} value={register.city} onChange={(event) => setRegister({ ...register, city: event.target.value })}>{Object.keys(CITIES).map((city) => <option key={city}>{city}</option>)}</select></label>
                  <label style={{ display: "grid", gap: 5 }}><strong style={{ fontSize: 13.5 }}>Rubro</strong><input className="bn-input" style={{ padding: "10px 14px" }} required value={register.businessType} onChange={(event) => setRegister({ ...register, businessType: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 5 }}><strong style={{ fontSize: 13.5 }}>Tipo de usuario</strong><select className="bn-input" style={{ padding: "10px 14px" }} value={register.role} onChange={(event) => setRegister({ ...register, role: event.target.value as Role })}><option value="comprador">Comprador</option><option value="vendedor">Vendedor</option><option value="transportista">Transportista</option></select></label>
                  <label style={{ display: "grid", gap: 5 }}><strong style={{ fontSize: 13.5 }}>Email</strong><input className="bn-input" style={{ padding: "10px 14px" }} type="email" autoComplete="email" required value={register.email} onChange={(event) => setRegister({ ...register, email: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 5 }}><strong style={{ fontSize: 13.5 }}>Contraseña</strong><input className="bn-input" style={{ padding: "10px 14px" }} type="password" autoComplete="new-password" minLength={8} required value={register.password} onChange={(event) => setRegister({ ...register, password: event.target.value })} /><small style={{ fontSize: 11.5 }}>Mínimo 8 caracteres.</small></label>
                </div>
                <div style={{ marginTop: 16 }}><Btn disabled={submitting || !authConfigured}>{submitting ? "Creando cuenta…" : "Crear cuenta"}</Btn></div>
              </form>
            )}

            {message && <p role="status" style={{ marginTop: 14, color: isError ? "#b91c1c" : "#166534", fontWeight: 600, fontSize: 13.5 }}>{message}</p>}
          </div>
        </section>

        <section
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 30,
            background: "#fafaf5f2",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderTop: "1px solid var(--color-border)",
            padding: "8px 20px 12px",
          }}
        >
          <div style={{ maxWidth: 1120, margin: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <strong style={{ fontSize: 13.5 }}>🤝 Alianzas y organizaciones</strong>
              <small style={{ color: "var(--color-subtle-fg)", fontSize: 11.5 }}>Empresas y entidades de la red (DEMO)</small>
            </div>
            <div className="bn-marquee">
              <div className="bn-marquee__track">
                {[...ALIANZAS, ...ALIANZAS].map((item, i) => (
                  <span key={`${item.nombre}-${i}`} className="bn-logo">
                    <span aria-hidden="true">{item.icon}</span>
                    {item.nombre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <CotizacionBolsaModal open={bolsaOpen} onClose={() => setBolsaOpen(false)} />
    </div>
  );
}
