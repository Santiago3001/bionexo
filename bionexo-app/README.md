# BioNexo NEA — app

Prototipo de la plataforma BioNexo NEA: Next.js 16 (App Router, `cacheComponents`) + Supabase (PostgreSQL, RLS, Realtime).

Documentación completa del alcance implementado (fases 1 a 4): [`../06-implementacion/implementacion.md`](../06-implementacion/implementacion.md).

## Requisitos

- Node.js 20+
- Un proyecto Supabase con las migraciones de `supabase/migrations/` aplicadas

## Puesta en marcha

```bash
cp .env.example .env.local   # completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev                  # http://localhost:3000
```

Scripts disponibles: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`,
`npx tsc --noEmit` (typecheck).

## Variables de entorno

Ver [.env.example](./.env.example). Los `.env*` están gitignoreados: **nunca** se suben claves.

## Estructura

```
app/
  page.tsx                  Login / registro por rol (comprador, vendedor, transportista)
  perfil/                   Perfil editable + cambio de contraseña
  reset-password/           Recuperar / fijar contraseña
  contratos/                Contratos con calendario de entregas
  mensajes/                 Lista de conversaciones y hilo ([id])
  comprador/ vendedor/      Vistas por rol
  transportista/            Mapa de cargas y rutas
  api/agente/               Endpoint del agente (IA con fallback por reglas)
  api/reporte/              Endpoint del reporte PDF
components/
  Shell.tsx                 Layout, navegación por rol y guard de rutas
  NotificacionesBell.tsx    Campana realtime + recordatorios de entregas
  ChatComercial.tsx         Hilo + resumen de condiciones + borrador de contrato
  Contratos.tsx             Estados, progreso y calendario de entregas
  BioNexoCarbon.tsx         Módulo ambiental del vendedor (análisis, factores, acuerdos, trazabilidad)
  CarbonChatCard.tsx        Propuesta de acuerdo de reparto desde el chat
  Impacto.tsx               Reporte de impacto: BioNexo Carbon + indicadores previos
lib/
  store.tsx                 Sesión Supabase, cookie bionexo_auth, perfil, datos
  chat.ts                   Conversaciones, mensajes, acuerdos, notificaciones
  contracts.ts              Contratos, entregas, recordatorios
  routes.ts                 Rutas de transporte desde la base
  carbon-core.ts            Núcleo de BioNexo Carbon: factores, destinos, análisis por reglas
  carbon.ts                 Datos de Carbon en el navegador (análisis y acuerdos)
app/api/
  agente/                   Endpoint del agente (IA con fallback por reglas)
  carbon/                   Endpoint de análisis ambiental (IA con fallback por reglas)
  reporte/                  Reportes PDF (`tipo=impacto` y `tipo=carbono`)
proxy.ts                    Protección server-side (cookie optimista; RLS = autoridad)
supabase/migrations/        Esquema y políticas (aplicadas en orden)
```

## Seguridad

- Las políticas **Row Level Security** son la autorización real: cada tabla se lee/escribe
  sólo si el usuario es participante (chat, contratos) o dueño del registro (ofertas, rutas, perfil).
- `proxy.ts` sólo evita renderizar vistas ajenas a partir de la cookie de sesión; no reemplaza a RLS.
- RPCs `security definer` (`ver_perfiles`, `crear_contrato`) están restringidas a `authenticated`.

## Base de datos

Migraciones en `supabase/migrations/`, aplicadas en orden sobre el proyecto Supabase:

1. `20261016010000_initial_bionexo.sql` — perfiles, ofertas, necesidades, órdenes, rutas.
2. `20261016130000_bionexo_interactions.sql` — conversaciones, mensajes, notificaciones, contratos, entregas, rutas tomadas + RLS + triggers.
3. `20261016140000_bionexo_chat_realtime.sql` — realtime + RPC `crear_contrato`.
4. `20261016150000_bionexo_ver_perfiles.sql` — RPC `ver_perfiles`.
5. `20261016160000_bionexo_notifications_insert.sql` — política de inserción propia para recordatorios.
6. `20261017000000_bionexo_futuros.sql` — ofertas y contratos a futuro.
7. `20261017090000_bionexo_carbon.sql` — análisis y acuerdos de BioNexo Carbon.
8. `20261017100000_demo_operacion_integrada.sql` — operación compartida entre comprador, vendedor y transportista.
9. `20261017113000_compact_carbon_and_recalibrate.sql` — recalibra análisis de Carbon guardados con la fórmula anterior (no borra registros).

## Flujo único de la demo

1. El comprador carga cantidad, producto y destino; el matching calcula sobre la cantidad solicitada o disponible, la menor.
2. El comprador abre una negociación real desde una oferta con vendedor registrado.
3. Ambas partes confirman las condiciones y generan el contrato.
4. Al activar el contrato se publica una sola operación logística compartida.
5. El transportista toma la operación y es el único que puede avanzar el estado; comprador y vendedor ven el mismo seguimiento.

Para verificar el flujo con las tres cuentas demo: `npm run verify:demo`.

## IA con Gemini

Configurá en `.env.local` una clave nueva y privada:

```env
GEMINI_API_KEY=tu_clave_nueva
GEMINI_MODEL=gemini-3.8-flash
```

El agente usa el catálogo real de Supabase y nunca expone la clave al navegador.

## Cuentas de prueba

`demo.comprador@bionexo.dev`, `demo.vendedor@bionexo.dev`, `demo.transportista@bionexo.dev`
— contraseña `Bionexo2026!` (la app está configurada sin confirmación de email).
