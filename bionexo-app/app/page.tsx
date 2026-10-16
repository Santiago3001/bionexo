"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CITIES } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Btn } from "@/components/ui";

const STATS: [string, string][] = [
  ["20 t/mes", "excedentes de cascarilla conectados en la demo"],
  ["150 km", "radio máximo entre planta y proveedor"],
  ["−33 %", "toneladas de CO₂e evitadas con la ruta de retorno"],
];

export default function Home() {
  const { user, login } = useStore();
  const router = useRouter();
  const [name, setName] = useState("Lucía Benítez");
  const [company, setCompany] = useState("Biomasa Chaco SA");
  const [cuit, setCuit] = useState("30-71234567-8");
  const [city, setCity] = useState("Resistencia");
  const [mail, setMail] = useState("compras@biomasachaco.com");
  const [rubro, setRubro] = useState("Generación de energía con biomasa");

  useEffect(() => {
    if (user) router.replace("/comprador/requerimiento");
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header className="bn-navbar" style={{ padding: "14px 20px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600, color: "var(--color-foreground)" }}>BioNexo NEA</span>
          <small style={{ color: "var(--color-muted-fg)" }}>Conectamos lo que producís con quien lo necesita · demo simulada</small>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "auto", padding: "0 20px" }}>
        {/* Hero */}
        <section style={{ padding: "64px 0 40px" }}>
          <span className="bn-badge" style={{ marginBottom: 18 }}>
            🌱 Economía circular para el NEA
          </span>
          <h1 style={{ margin: "0 0 14px", fontSize: "clamp(2.2rem, 5vw, 3.4rem)", lineHeight: 1.1, maxWidth: 820 }}>
            Convertí tus <span className="bn-gradient-text">excedentes</span> en insumos para otra empresa.
          </h1>
          <p style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-muted-fg)", maxWidth: 640 }}>
            Publicá lo que sobra, encontrá quién lo necesita y coordiná el transporte con datos de emisiones reales. Comprá, vendé y hacé trueques desde una sola cuenta.
          </p>

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", marginTop: 40 }}>
            {STATS.map(([n, t]) => (
              <div key={n} style={{ background: "var(--color-bg-alt)", border: "1px solid var(--color-border)", borderRadius: 24, padding: 24 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "2.4rem", color: "var(--color-primary)", lineHeight: 1.1 }}>{n}</div>
                <div style={{ fontSize: 14, color: "var(--color-muted-fg)", marginTop: 6 }}>{t}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--color-subtle-fg)", marginTop: 10 }}>Datos simulados de la demo.</p>
        </section>

        {/* Formulario */}
        <section style={{ padding: "8px 0 64px" }}>
          <div className="bn-card" style={{ padding: "clamp(24px, 4vw, 40px)" }}>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.6rem" }}>Creá el perfil de tu empresa</h2>
            <p style={{ margin: "0 0 22px", color: "var(--color-muted-fg)", fontSize: 15 }}>
              Login mockeado — backend mañana. Después usá “Cambiar de modo” para pasar entre empresa, transportista y modelo de negocio.
            </p>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
              <div style={{ display: "grid", gap: 16 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-foreground)" }}>Nombre y apellido</span>
                  <input className="bn-input" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-foreground)" }}>Empresa / razón social</span>
                  <input className="bn-input" value={company} onChange={(e) => setCompany(e.target.value)} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-foreground)" }}>CUIT</span>
                  <input className="bn-input" value={cuit} onChange={(e) => setCuit(e.target.value)} />
                </label>
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-foreground)" }}>Ciudad</span>
                  <select className="bn-input" value={city} onChange={(e) => setCity(e.target.value)}>
                    {Object.keys(CITIES).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-foreground)" }}>Email</span>
                  <input className="bn-input" type="email" value={mail} onChange={(e) => setMail(e.target.value)} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--color-foreground)" }}>Rubro ({rubro.length} caracteres)</span>
                  <input className="bn-input" value={rubro} onChange={(e) => setRubro(e.target.value)} />
                </label>
              </div>
            </div>
            <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <Btn onClick={() => { login({ name, company, city, cuit }); router.push("/comprador/requerimiento"); }}>Crear perfil y entrar</Btn>
              <span style={{ fontSize: 13, color: "var(--color-muted-fg)" }}>Sin contraseña en la demo.</span>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ background: "var(--color-bg-dark)", color: "#d8e2dc", padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 18, color: "#fff" }}>BioNexo NEA</div>
        <div style={{ fontSize: 13, marginTop: 6, color: "#84a98c" }}>Economía circular en Corrientes, Misiones y Chaco · datos simulados</div>
      </footer>
    </div>
  );
}
