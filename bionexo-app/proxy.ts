import { NextResponse, type NextRequest } from "next/server";

// Next.js 16: middleware pasó a llamarse proxy. Su rol es una verificación
// optimista de sesión/rol. La autorización real de los datos la aplican las
// políticas RLS de Supabase; esto evita que un usuario vea pantallas ajenas.
const COOKIE = "bionexo_auth";

const HOME_POR_ROL: Record<string, string> = {
  comprador: "/comprador/requerimiento",
  vendedor: "/vendedor/publicaciones",
  transportista: "/transportista/mapa",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const raw = request.cookies.get(COOKIE)?.value;

  let session: { role?: string; exp?: number } | null = null;
  if (raw) {
    try {
      session = JSON.parse(raw) as { role?: string; exp?: number };
    } catch {
      session = null;
    }
  }

  const vigente = Boolean(session?.role) && Number(session?.exp ?? 0) * 1000 > Date.now();

  if (!vigente) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const response = NextResponse.redirect(url);
    response.cookies.delete(COOKIE);
    return response;
  }

  const role = session!.role as string;
  const permitido =
    pathname === "/perfil" ||
    pathname === "/negocio" ||
    pathname === "/contratos" ||
    pathname.startsWith("/mensajes") ||
    pathname.startsWith(`/${role}`);

  if (!permitido) {
    const url = request.nextUrl.clone();
    url.pathname = HOME_POR_ROL[role] ?? "/comprador/requerimiento";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/comprador/:path*",
    "/vendedor/:path*",
    "/transportista/:path*",
    "/mensajes/:path*",
    "/contratos",
    "/perfil",
    "/negocio",
  ],
};
