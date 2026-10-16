"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Card, Muted, Tag, Btn } from "@/components/ui";
import { Shell } from "@/components/Shell";
import { CITIES } from "@/lib/data";
import { useStore, type ProfileInput } from "@/lib/store";

export default function Page() {
  const { user, role, updateProfile, updatePassword } = useStore();

  const [form, setForm] = useState<ProfileInput>({
    name: "",
    company: "",
    cuit: "",
    city: "Resistencia",
    businessType: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [password, setPassword] = useState("");
  const [mensajePw, setMensajePw] = useState("");
  const [esErrorPw, setEsErrorPw] = useState(false);
  const [guardandoPw, setGuardandoPw] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      company: user.company ?? "",
      cuit: user.cuit ?? "",
      city: user.city ?? "Resistencia",
      businessType: user.businessType ?? "",
    });
  }, [user]);

  if (!user) return null;

  function set(campo: keyof ProfileInput, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    const result = await updateProfile(form);
    setGuardando(false);
    setMensaje(result.message);
    setEsError(!result.ok);
  }

  async function guardarPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardandoPw(true);
    setMensajePw("");
    const result = await updatePassword(password);
    setGuardandoPw(false);
    setMensajePw(result.message);
    setEsErrorPw(!result.ok);
    if (result.ok) setPassword("");
  }

  return (
    <Shell>
      <Card>
        <h3 style={{ marginTop: 0 }}>Mi perfil</h3>
        <p>
          <Muted>
            Los datos se guardan en la tabla <code>profiles</code> de Supabase y actualizan la sesión. El rol no se puede
            autocambiar: también está validado por políticas RLS.
          </Muted>
        </p>

        <form onSubmit={guardar} style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", marginTop: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Nombre y apellido</strong>
            <input className="bn-input" required value={form.name} onChange={(event) => set("name", event.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Empresa / razón social</strong>
            <input className="bn-input" required value={form.company} onChange={(event) => set("company", event.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>CUIT</strong>
            <input className="bn-input" required value={form.cuit} onChange={(event) => set("cuit", event.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Ciudad</strong>
            <select className="bn-input" value={form.city} onChange={(event) => set("city", event.target.value)}>
              {Object.keys(CITIES).map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Rubro</strong>
            <input className="bn-input" required value={form.businessType} onChange={(event) => set("businessType", event.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Email</strong>
            <input className="bn-input" value={user.email ?? ""} readOnly style={{ opacity: 0.7 }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Rol</strong>
            <div style={{ paddingTop: 4 }}>
              <Tag>{role}</Tag>
            </div>
          </label>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <Btn disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</Btn>
          </div>
        </form>

        {mensaje && (
          <p role="status" style={{ marginTop: 14, color: esError ? "#b91c1c" : "#166534", fontWeight: 600 }}>{mensaje}</p>
        )}
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>
        <form onSubmit={guardarPassword} style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginTop: 10 }}>
          <label style={{ display: "grid", gap: 6, minWidth: 260 }}>
            <strong>Contraseña nueva</strong>
            <input
              className="bn-input"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <Btn disabled={guardandoPw}>{guardandoPw ? "Guardando…" : "Actualizar contraseña"}</Btn>
        </form>
        {mensajePw && (
          <p role="status" style={{ marginTop: 12, color: esErrorPw ? "#b91c1c" : "#166534", fontWeight: 600 }}>{mensajePw}</p>
        )}
        <p>
          <Muted>¿No recordás la contraseña actual? Pedí el enlace de recuperación en el login.</Muted>
        </p>
      </Card>
    </Shell>
  );
}
