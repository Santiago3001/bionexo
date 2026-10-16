-- BioNexo NEA: el usuario autenticado puede registrar sus propias
-- notificaciones de sistema (recordatorios de entregas próximas que
-- calcula la app). Los mensajes y contratos siguen generando las suyas
-- por trigger (security definer).

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications for insert to authenticated
with check (user_id = auth.uid());
