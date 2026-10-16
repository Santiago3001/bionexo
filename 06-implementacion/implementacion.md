# Implementación técnica — Fases 1 a 4

> Estado: **completado y probado de punta a punta** (16/10/2026).
> Alcance de este documento: fases 1 a 4 del plan de implementación de BioNexo NEA.
> Código en [`bionexo-app/`](../bionexo-app/) (Next.js 16 + Supabase).

---

## 1. Cómo levantar la app

```bash
cd bionexo-app
cp .env.example .env.local      # completar URL y anon key de Supabase
npm install
npm run dev                     # http://localhost:3000
```

Variables de entorno:

| Variable | Para qué sirve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública; el navegador la usa y el servidor la valida por `auth.getUser()` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | **Opcional y fuera de este alcance**: si falta, `/api/agente` responde 503 `ia_no_configurada` y la UI cae al motor por reglas |

### Cuentas de prueba (también figuran en el README)

| Rol | Email | Contraseña |
|---|---|---|
| Comprador | `demo.comprador@bionexo.dev` | `Bionexo2026!` |
| Vendedor | `demo.vendedor@bionexo.dev` | `Bionexo2026!` |
| Transportista | `demo.transportista@bionexo.dev` | `Bionexo2026!` |

### Base de datos

Las migraciones viven en `bionexo-app/supabase/migrations/` y se aplicaron sobre el proyecto `bionexo` (ref `vanjmvkvhoadhjbfvopy`). Para re-aplicarlas desde cero:

```bash
cd bionexo-app && npx supabase db push   # o pegar cada .sql en el SQL Editor de Supabase
```

> En el SQL Editor de Supabase **un error revierte todo el script en bloque** (PostgreSQL usa transacciones); conviene ejecutar migración por migración.

---

## 2. Fase 1 — Migración SQL: conversaciones, mensajes, notificaciones, contratos, entregas, rutas tomadas

### Tablas nuevas o extendidas

| Tabla | Propósito |
|---|---|
| `conversations` | Un hilo por par comprador/vendedor sobre una oferta (`offer_id` nullable para consultas generales). `seller_id` **nullable** para poder chatear con ofertas simuladas que no tienen dueño. Único parcial por oferta+comprador |
| `messages` | Mensajes del hilo: `sender_id`, `body`, `attachment_name`, `created_at`. Índice `(conversation_id, created_at)` |
| `notifications` | Notificaciones por usuario: `type`, `title`, `body`, `link`, `read` |
| `contracts` | Contrato de abastecimiento: producto, cantidad, precio unitario, frecuencia, duración, fechas, `status` (`borrador/activo/completado/cancelado`), `conversation_id` de origen |
| `contract_deliveries` | Calendario de entregas de cada contrato: `due_date`, `quantity_tons`, `status` (`pendiente/entregada/retrasada/cancelada`) |
| `transport_routes` (extendida) | Columnas nuevas `taken_by` y `taken_at`; `carrier_id` pasó a nullable para que un transportista pueda tomar rutas ajenas |

### Row Level Security (la autorización real de los datos)

Todo queda protegido por políticas `to authenticated`; el criterio es siempre **participación**:

- `conversations`: ven/crean/editan sólo comprador y vendedor del hilo (`conversations_participants_select`, `conversations_create_own`, `conversations_update_participants`).
- `messages`: insertan y leen sólo los participantes (`messages_participants_select/insert`).
- `notifications`: cada usuario lee/edita las suyas (`notifications_read_own` / `notifications_update_own`) y puede **insertar las suyas** (`notifications_insert_own`, migración 5) para registrar recordatorios de entregas que calcula la app.
- `contracts` y `contract_deliveries`: sólo comprador/vendedor del contrato (`contracts_participants_*`, `deliveries_participants_*`), con borrador borrable por su creador.
- `transport_routes`: lectura autenticada; tomar una ruta exige rol transportista y sólo se la puede reservar a uno mismo (`carriers_reserve_routes`).
- Se mantienen las de la fase anterior: `offers_read_active`, `sellers_*`, `buyers_manage_own_needs`, `orders_manage_own`, `profiles_select_own/update_own`.

### Funciones, triggers e índices

- `set_updated_at()` → trigger `before update` sobre `profiles, offers, purchase_needs, transport_routes, conversations, orders, contracts`.
- `handle_new_user()` → `on_auth_user_created`: crea la fila de `profiles` desde `raw_user_meta_data` (nombre, empresa, CUIT, ciudad, rubro, rol).
- `notify_new_message()` → trigger `after insert on messages`: crea la notificación “Nuevo mensaje de …” para la contraparte (**security definer**, así funciona aunque la política sea restrictiva).
- `ver_perfiles(uuid[])` → RPC `security definer`, sólo `authenticated`: devuelve nombre, empresa, ciudad, rol y rubro de los IDs que se le pasan (para mostrar a la contraparte sin exponer la tabla completa).
- `crear_contrato(...)` → RPC (migración 3): crea el contrato **y su calendario** con `generate_series` (una entrega por período entre `start_date` y la duración) y crea una notificación para la otra parte. Devuelve el id del contrato.
- Índices de lista: `conversations_buyer_idx`, `conversations_seller_idx`, `messages_thread_idx`, `notifications_user_idx`, `contracts_buyer_idx`, `contracts_seller_idx`.
- Realtime: `supabase_realtime` publica `messages`, `conversations` y `notifications`.

### Archivos de migración

| Archivo | Contenido |
|---|---|
| `20261016010000_initial_bionexo.sql` | Esquema inicial (perfiles, ofertas, necesidades, órdenes, rutas) |
| `20261016130000_bionexo_interactions.sql` | Conversaciones, mensajes, notificaciones, contratos, entregas, rutas tomadas, RLS completo, triggers |
| `20261016140000_bionexo_chat_realtime.sql` | `seller_id` nullable, publicación realtime, RPC `crear_contrato` |
| `20261016150000_bionexo_ver_perfiles.sql` | RPC `ver_perfiles` |
| `20261016160000_bionexo_notifications_insert.sql` | Política `notifications_insert_own` (recordatorios) |

---

## 3. Fase 2 — Protección server-side (proxy.ts de Next 16) + perfil editable + recuperar contraseña

### `proxy.ts` (middleware renombrado en Next 16)

- **Matcher**: `/comprador/:path*`, `/vendedor/:path*`, `/transportista/:path*`, `/mensajes/:path*`, `/contratos`, `/perfil`, `/negocio`.
- Lee la cookie `bionexo_auth` (`{ role, exp }`) que escribe la app en el login: si no existe o venció → `307` a `/`.
- Si el rol no coincide con el destino (`path.startsWith("/" + role)`, con excepciones comunes `/perfil`, `/negocio`, `/contratos`, `/mensajes*`) → `307` al home del rol.
- **La cookie es verificación optimista** (evita renderizar vistas ajenas): la autorización real de cada fila la hace RLS en Supabase. La anon key nunca da acceso por sí sola.

### Perfil editable — `app/perfil/page.tsx` + `lib/store.tsx`

- Formulario con nombre, empresa, CUIT, ciudad, rubro y rol → `updateProfile()` (update sobre `profiles`, política `profiles_update_own`).
- Cambio de contraseña con la contraseña actual (`updatePassword`); si la sesión de Supabase trae proveedor `github` (login por OAuth) se avisa y se ofrece restablecer por email.

### Recuperar contraseña — `app/reset-password/page.tsx`

- “¿Olvidaste tu contraseña?” en el login → pedir email → `supabase.auth.resetPasswordForEmail(..., { redirectTo: /reset-password })`.
- En `/reset-password` se puede pedir el link de nuevo o fijar la contraseña nueva (`updatePassword`), y al terminar redirige al home del rol.

### Cookie de sesión

`AUTH_COOKIE = "bionexo_auth"`: se escribe en `signIn` y en la restauración de sesión (`exp` = `expires_at` de Supabase) y se borra en `logout`. El proxy y el `Shell` la leen para evitar rebotes.

---

## 4. Fase 3 — Chat comercial persistente + realtime + notificaciones

### Capa de datos — `lib/chat.ts`

| Función | Qué hace |
|---|---|
| `abrirConversacion(oferta, compradorId)` | Busca o crea la conversación de esa oferta para ese comprador (RLS `conversations_create_own`) y devuelve su id |
| `abrirConsultaGeneral(compradorId)` | Hilo general con `seller_id` null (oferta simulada sin dueño) |
| `listarConversaciones(userId)` | Lista de hilos con última actividad, contraparte y estado de acuerdo |
| `cargarConversacion` / `cargarMensajes` | Hilo y mensajes (500 últimos, orden cronológico) |
| `enviarMensaje(...)` | Inserta el mensaje; el trigger `notify_new_message` genera la notificación de la contraparte |
| `suscribirseAHilos(id, cb)` | Realtime `INSERT` sobre `messages` del hilo (fallback: polling cada 8 s en el componente) |
| `suscribirseANotificaciones(userId, cb)` | Realtime sobre `notifications` del usuario |
| `listarNotificaciones` / `marcarNotificacionLeida` / `marcarTodasLeidas` | Lectura y marcado de la campana |
| `proponerCondiciones` / `confirmarAcuerdo` | Resumen de condiciones y confirmaciones (fase 4) |

> **Detalle importante:** `supabase-js` lanza *“cannot add postgres_changes callbacks … after subscribe()”* si dos componentes abren el mismo tópico. Por eso ambas suscripciones pasan por un registro compartido (`suscribirseATabla`): un canal por tópico con un `Set` de oyentes, y se cierra cuando queda sin oyentes.

### UI

- `components/ChatComercial.tsx`: hilo con realtime + polling, composer de mensajes, panel “Resumen de condiciones”, botón “Preparar borrador de contrato”.
- `app/mensajes/page.tsx`: lista de conversaciones (pasa por ver_perfiles para mostrar contraparte).
- `app/mensajes/[id]/page.tsx`: página del hilo. Es **server component** con `export const instant = false` (Next 16 / `cacheComponents`) que sólo resuelve `params` y renderiza el componente cliente.
- `components/NotificacionesBell.tsx`: campana en el encabezado de todo el `Shell`; realtime + polling cada 30 s, contador de no leídas, marcado individual o total, y emisión de recordatorios de entregas (una vez por día, con `localStorage`).

---

## 5. Fase 4 — Resumen de condiciones + confirmación + contratos con calendario de entregas

### Flujo de acuerdo

1. **Proponer condiciones** (`proponerCondiciones`): cantidad (t), precio (US$/t), frecuencia, duración (meses) y términos. Escribe `proposal`, `proposed_by`, `agreed_status = 'propuesto'` en `conversations` (política de participantes) y agrega un mensaje de sistema al hilo.
2. **Confirmar condiciones** (`confirmarAcuerdo`): cada parte confirma; setea `buyer_confirmed_at` / `seller_confirmed_at`. Cuando ambos existen, `agreed_status = 'acordado'` → la UI pinta **ACUERDO CERRADO** y habilita el borrador de contrato. Cualquier nueva propuesta reinicia las confirmaciones.
3. Estados en UI: `SIN PROPUESTA` → `EN NEGOCIACIÓN` → `ACUERDO CERRADO`, con “Comprador: confirmó … / Vendedor: pendiente”.

### Contratos — RPC `crear_contrato` + `lib/contracts.ts` + `components/Contratos.tsx`

- `crearContrato(conversacionId, ...)` llama a la RPC que crea el contrato en `borrador` **y su calendario**: `generate_series` genera una entrega por período (mensual/trimestral/semanal/única) entre `start_date` y la duración, con la cantidad indicada; además notifica a la otra parte.
- `listarContratos(userId)`: contratos donde el usuario es comprador o vendedor, con sus entregas (embedding `contract_deliveries`).
- `cambiarEstadoContrato`: `borrador → activo` (o cancelar).
- `marcarEntrega`: entrega `pendiente → entregada`; recalcula progreso (`1/6 · 17%`) y, si terminan todas, el contrato pasa a `completado`.
- `recordatoriosDeEntregas(userId)`: entregas de contratos activos que vencen en los próximos días → la campana las inserta como notificaciones (`notifications_insert_own`).
- `app/contratos/page.tsx`: página agregada al `Shell` y al matcher del proxy (roles comprador, vendedor y transportista).
- Etiquetas del panel: `N contrato(s)`, `N activo(s)`, `N t programadas`.

---

## 6. Verificación E2E realizada (16/10/2026)

Ejecutada en el navegador sobre `localhost:3000` con datos reales en Supabase:

| # | Qué se probó | Resultado |
|---|---|---|
| 1 | Registro con rol vendedor (`demo.vendedor`) → alta de perfil por trigger `handle_new_user` | ✅ |
| 2 | Publicar oferta como vendedor (política `sellers_insert_offers`) | ✅ “Oferta publicada y disponible para el matching” |
| 3 | Login como comprador → la oferta aparece en el dashboard de coincidencias | ✅ |
| 4 | “Negociar” → se crea la conversación (`/mensajes/<id>`) con RLS correcto | ✅ |
| 5 | Envío de mensaje y persistencia tras recargar | ✅ |
| 6 | Proponer condiciones (15 t · USD 36/t · Mensual · 6 meses) | ✅ guardado |
| 7 | Confirmación del comprador y refresco del panel | ✅ “Comprador: confirmó 16/10, 12:08” |
| 8 | El vendedor ve el hilo completo, la propuesta y confirma | ✅ **ACUERDO CERRADO** |
| 9 | “Preparar borrador de contrato” → RPC `crear_contrato` con calendario | ✅ 6 entregas (16/10/2026 → 16/03/2027), 15 t c/u |
| 10 | `/contratos`: activar el contrato y marcar una entrega | ✅ estado `ACTIVO`, progreso `1/6 · 17%` |
| 11 | Campana de notificaciones: mensaje del trigger y notificación del contrato (RPC) | ✅ en ambas partes |
| 12 | Proxy server-side: con cookie → `200`, sin cookie → `307 /` | ✅ |
| 13 | Persistencia tras recarga y reinicio del servidor | ✅ (todo desde Supabase) |
| 14 | `npx tsc --noEmit` y `npm run build` | ✅ 0 errores, 23 rutas |

### Bugs encontrados en las pruebas y corregidos

1. **Rebote a la home en páginas dinámicas.** `authLoading` se apagaba antes de terminar de cargar el perfil: `Shell` veía “sin usuario” y redirigía a `/`. Corregido en `lib/store.tsx` (se espera a `loadUserData` antes de `setAuthLoading(false)`) y con una guarda en `Shell` que espera mientras exista cookie vigente.
2. **Excepción de Realtime** por dos componentes suscribiéndose al mismo tópico (`cannot add postgres_changes callbacks … after subscribe()`). Corregido con el registro de canales compartidos de `lib/chat.ts`.
3. **`export const runtime = "nodejs"`** en `app/api/agente/route.ts` incompatible con `cacheComponents` → eliminado.
4. **Prerender bloqueado en `/mensajes/[id]`** → la página pasó a server component con `instant = false`.

---

## 7. Pendientes (fuera de este alcance)

- **Fase 5 — Reporte PDF real**: existe `app/api/reporte/route.ts` + `components/ReporteButton.tsx`; requiere `pdf-lib` y `SUPABASE_DB_PASSWORD` no es necesaria (usa el token de sesión).
- **Fase 6 — Agente con IA real por API**: `app/api/agente/route.ts` está listo, **falta `OPENAI_API_KEY` en `.env.local`**; sin la clave responde 503 `ia_no_configurada` y la UI usa el motor por reglas (verificado).
- **Fase 7 — Rutas de transporte persistentes + formulario de subproducto para comprador**: `lib/routes.ts` y el panel de rutas existen; el formulario de subproducto sigue deshabilitado para el rol comprador (sólo lectura).
- **Fase 8 — Build + E2E + push completos**: build y push de fases 1-4 hechos (commit `8a1d0b6`).

---

## 8. Seguridad y supuestos

- La clave anon y la URL son públicas por diseño: **RLS es la única autorización real**; el proxy y la cookie sólo evitan mostrar vistas ajenas.
- Ninguna vista renderiza datos de tablas sin políticas: si una política falta, la API devuelve 0 filas y la UI muestra estado vacío.
- Perfiles, ofertas sembradas y datos de la demostración son **DATO SIMULADO**.
