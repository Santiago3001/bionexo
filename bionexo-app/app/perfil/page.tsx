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
          <tr><th style={{ textAlign: "left" }}>Rol</th><td><Tag>{role}</Tag></td></tr>
        </tbody></table>
        <p><Muted>Login mockeado. Backend real mañana: este perfil se reemplaza por sesión + API.</Muted></p>
      </Card>
    </Shell>
  );
}
