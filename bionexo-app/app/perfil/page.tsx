"use client";
import { Card, Muted, Tag } from "@/components/ui";
import { Shell } from "@/components/Shell";
import { useStore } from "@/lib/store";

export default function Page() {
  const { user, role } = useStore();
  if (!user) return null;
  return (
    <Shell>
      <Card>
        <h3 style={{ marginTop: 0 }}>Perfil</h3>
        <table style={{ width: "100%", fontSize: 14 }}><tbody>
          <tr><th style={{ textAlign: "left" }}>Nombre</th><td>{user.name}</td></tr>
          <tr><th style={{ textAlign: "left" }}>Empresa</th><td>{user.company}</td></tr>
          <tr><th style={{ textAlign: "left" }}>CUIT</th><td>{user.cuit}</td></tr>
          <tr><th style={{ textAlign: "left" }}>Ciudad</th><td>{user.city}</td></tr>
          <tr><th style={{ textAlign: "left" }}>Email</th><td>{user.email}</td></tr>
          <tr><th style={{ textAlign: "left" }}>Rubro</th><td>{user.businessType || "Sin completar"}</td></tr>
          <tr><th style={{ textAlign: "left" }}>Rol</th><td><Tag>{role}</Tag></td></tr>
        </tbody></table>
        <p><Muted>Sesión autenticada con Supabase. El rol también se valida mediante políticas RLS.</Muted></p>
      </Card>
    </Shell>
  );
}

