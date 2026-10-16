"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { homeForRole, useStore } from "@/lib/store";
import { Btn } from "@/components/ui";

export default function ResetPasswordPage() {
  const { user, authLoading, authConfigured, resetPassword, updatePassword } = useStore();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Si llegamos desde el enlace de recuperación, Supabase ya creó una sesión
  // (detectSessionInUrl) y user queda seteado: mostramos el alta de contraseña.
  const enModoNueva = Boolean(user);

  useEffect(() => {
    if (user && message === "") {
      // No redirigimos si el usuario acaba de pedir el correo: solo cuando
      // viene del enlace y setea la contraseña nueva.
    }
  }, [user, message]);

  async function handlePedido(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await resetPassword(email);
    setSubmitting(false);
    setMessage(result.message);
    setIsError(!result.ok);
  }

  async function handleNueva(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== repeat) {
      setMessage("Las contraseñas no coinciden.");
      setIsError(true);
      return;
    }
    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);
    setMessage(result.message);
    setIsError(!result.ok);
    if (result.ok) {
      window.setTimeout(() => router.replace(homeForRole(user?.role ?? "comprador")), 900);
    }
  }

  if (authLoading) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p>Verificando enlace…</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header className="bn-navbar" style={{ padding: "14px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "auto", display: "flex", gap: 12, alignItems: "baseline" }}>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 600 }}>BioNexo NEA</span>
          <small style={{ color: "var(--color-muted-fg)" }}>Recuperación de acceso</small>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "auto", padding: "40px 20px" }}>
        <div className="bn-card" style={{ padding: 32 }}>
          {!enModoNueva ? (
            <form onSubmit={handlePedido}>
              <h2 style={{ margin: "0 0 6px", fontSize: "1.5rem" }}>Recuperar contraseña</h2>
              <p style={{ margin: "0 0 20px", color: "var(--color-muted-fg)" }}>
                Dejanos el email de tu cuenta y te enviamos un enlace para crear una contraseña nueva.
              </p>
              <label style={{ display: "grid", gap: 6 }}>
                <strong>Email</strong>
                <input
                  className="bn-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <Btn disabled={submitting || !authConfigured}>{submitting ? "Enviando…" : "Enviar enlace"}</Btn>
                <Link href="/" style={{ fontSize: 14, color: "var(--color-primary)", fontWeight: 600 }}>
                  Volver a iniciar sesión
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleNueva}>
              <h2 style={{ margin: "0 0 6px", fontSize: "1.5rem" }}>Elegí tu contraseña nueva</h2>
              <p style={{ margin: "0 0 20px", color: "var(--color-muted-fg)" }}>
                Sesión verificada para <strong>{user?.email}</strong>. Definí la contraseña nueva de tu cuenta.
              </p>
              <div style={{ display: "grid", gap: 16 }}>
                <label style={{ display: "grid", gap: 6 }}>
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
                <label style={{ display: "grid", gap: 6 }}>
                  <strong>Repetir contraseña</strong>
                  <input
                    className="bn-input"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={repeat}
                    onChange={(event) => setRepeat(event.target.value)}
                  />
                </label>
              </div>
              <div style={{ marginTop: 22 }}>
                <Btn disabled={submitting}>{submitting ? "Guardando…" : "Guardar contraseña"}</Btn>
              </div>
            </form>
          )}

          {message && (
            <p role="status" style={{ marginTop: 16, color: isError ? "#b91c1c" : "#166534", fontWeight: 600 }}>
              {message}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
