"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CITIES } from "@/lib/data";
import { homeForRole, type RegisterInput, type Role, useStore } from "@/lib/store";
import { Btn } from "@/components/ui";

const STATS: [string, string][] = [
  ["20 t/mes", "excedentes de cascarilla conectados en la demo"],
  ["150 km", "radio máximo entre planta y proveedor"],
  ["−33 %", "reducción estimada con una ruta más corta"],
];

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
    <div style={{ minHeight: "100vh" }}>
      <header className="bn-navbar" style={{ padding: "14px 20px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600, color: "var(--color-foreground)" }}>BioNexo NEA</span>
          <small style={{ color: "var(--color-muted-fg)" }}>Conectamos lo que producís con quien lo necesita</small>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "auto", padding: "0 20px" }}>
        <section style={{ padding: "56px 0 32px" }}>
          <span className="bn-badge" style={{ marginBottom: 18 }}>🌱 Economía circular para el NEA</span>
          <h1 style={{ margin: "0 0 14px", fontSize: "clamp(2.2rem, 5vw, 3.4rem)", lineHeight: 1.1, maxWidth: 820 }}>
            Convertí tus <span className="bn-gradient-text">excedentes</span> en insumos para otra empresa.
          </h1>
          <p style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-muted-fg)", maxWidth: 700 }}>
            Ingresá como comprador, vendedor o transportista. Cada cuenta accede únicamente a las herramientas correspondientes a su rol.
          </p>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", marginTop: 34 }}>
            {STATS.map(([number, text]) => (
              <div key={number} style={{ background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: 24, padding: 24 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "2.4rem", color: "var(--color-primary)", lineHeight: 1.1 }}>{number}</div>
                <div style={{ fontSize: 14, color: "var(--color-muted-fg)", marginTop: 6 }}>{text}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--color-subtle-fg)", marginTop: 10 }}>Resultados de demostración identificados como DATO SIMULADO.</p>
        </section>

        <section style={{ padding: "8px 0 64px" }}>
          <div className="bn-card" style={{ padding: "clamp(24px, 4vw, 40px)", maxWidth: 820, margin: "auto" }}>
            <div role="tablist" aria-label="Acceso" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              <button className="bn-mode-btn" data-open={mode === "login"} role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setMessage(""); }}>Iniciar sesión</button>
              <button className="bn-mode-btn" data-open={mode === "register"} role="tab" aria-selected={mode === "register"} onClick={() => { setMode("register"); setMessage(""); }}>Crear cuenta</button>
            </div>

            {!authConfigured && (
              <div style={{ background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412", borderRadius: 12, padding: 14, marginBottom: 18 }}>
                Falta configurar Supabase. Copiá <code>.env.example</code> como <code>.env.local</code> y agregá la URL y la clave pública del proyecto.
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin}>
                <h2 style={{ margin: "0 0 6px", fontSize: "1.6rem" }}>Ingresá a tu cuenta</h2>
                <p style={{ margin: "0 0 22px", color: "var(--color-muted-fg)" }}>Tu perfil determina las pantallas y operaciones disponibles.</p>
                <div style={{ display: "grid", gap: 16 }}>
                  <label style={{ display: "grid", gap: 6 }}><strong>Email</strong><input className="bn-input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                  <label style={{ display: "grid", gap: 6 }}><strong>Contraseña</strong><input className="bn-input" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                  <div style={{ marginTop: -6, textAlign: "right" }}>
                    <Link href="/reset-password" style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 600 }}>¿Olvidaste tu contraseña?</Link>
                  </div>
                </div>
                <div style={{ marginTop: 24 }}><Btn disabled={submitting || !authConfigured}>{submitting ? "Ingresando…" : "Iniciar sesión"}</Btn></div>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <h2 style={{ margin: "0 0 6px", fontSize: "1.6rem" }}>Creá tu perfil BioNexo</h2>
                <p style={{ margin: "0 0 22px", color: "var(--color-muted-fg)" }}>Elegí el rol principal. Los permisos también se controlan en la base de datos.</p>
                <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
                  <label style={{ display: "grid", gap: 6 }}><strong>Nombre y apellido</strong><input className="bn-input" required value={register.name} onChange={(event) => setRegister({ ...register, name: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 6 }}><strong>Empresa / razón social</strong><input className="bn-input" required value={register.company} onChange={(event) => setRegister({ ...register, company: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 6 }}><strong>CUIT</strong><input className="bn-input" required value={register.cuit} onChange={(event) => setRegister({ ...register, cuit: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 6 }}><strong>Ciudad</strong><select className="bn-input" value={register.city} onChange={(event) => setRegister({ ...register, city: event.target.value })}>{Object.keys(CITIES).map((city) => <option key={city}>{city}</option>)}</select></label>
                  <label style={{ display: "grid", gap: 6 }}><strong>Rubro</strong><input className="bn-input" required value={register.businessType} onChange={(event) => setRegister({ ...register, businessType: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 6 }}><strong>Tipo de usuario</strong><select className="bn-input" value={register.role} onChange={(event) => setRegister({ ...register, role: event.target.value as Role })}><option value="comprador">Comprador</option><option value="vendedor">Vendedor</option><option value="transportista">Transportista</option></select></label>
                  <label style={{ display: "grid", gap: 6 }}><strong>Email</strong><input className="bn-input" type="email" autoComplete="email" required value={register.email} onChange={(event) => setRegister({ ...register, email: event.target.value })} /></label>
                  <label style={{ display: "grid", gap: 6 }}><strong>Contraseña</strong><input className="bn-input" type="password" autoComplete="new-password" minLength={8} required value={register.password} onChange={(event) => setRegister({ ...register, password: event.target.value })} /><small>Mínimo 8 caracteres.</small></label>
                </div>
                <div style={{ marginTop: 24 }}><Btn disabled={submitting || !authConfigured}>{submitting ? "Creando cuenta…" : "Crear cuenta"}</Btn></div>
              </form>
            )}

            {message && <p role="status" style={{ marginTop: 18, color: isError ? "#b91c1c" : "#166534", fontWeight: 600 }}>{message}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
