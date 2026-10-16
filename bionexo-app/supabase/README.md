# Configuración de Supabase

1. Crear un proyecto en Supabase.
2. Abrir **SQL Editor** y ejecutar `migrations/20261016010000_initial_bionexo.sql`.
3. En **Authentication > Providers > Email**, habilitar email y contraseña.
4. Para una demo inmediata, desactivar temporalmente la confirmación de email. Para producción, mantenerla activa y configurar el correo.
5. Copiar `.env.example` como `.env.local` y completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_ANON
```

La clave `anon` es pública y trabaja junto con las políticas RLS. Nunca se debe colocar la `service_role` en el navegador ni en variables `NEXT_PUBLIC_*`.
