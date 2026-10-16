"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface RutaTransporte {
  id: number;
  vehicleType: string;
  capacityTons: number;
  originCity: string;
  destinationCity: string;
  availableDate: string;
  routeType: "planificada" | "retorno";
  pricePerKm: number | null;
  status: "available" | "reserved" | "completed" | "cancelled";
  takenBy: string | null;
  takenAt: string | null;
}

type FilaRuta = Record<string, unknown>;

const ESTADOS: RutaTransporte["status"][] = ["available", "reserved", "completed", "cancelled"];

function rutaFromRow(row: FilaRuta): RutaTransporte {
  const routeType = String(row.route_type ?? "planificada");
  const status = String(row.status ?? "available");
  return {
    id: Number(row.id),
    vehicleType: String(row.vehicle_type ?? ""),
    capacityTons: Number(row.capacity_tons ?? 0),
    originCity: String(row.origin_city ?? ""),
    destinationCity: String(row.destination_city ?? ""),
    availableDate: String(row.available_date ?? ""),
    routeType: routeType === "retorno" ? "retorno" : "planificada",
    pricePerKm:
      row.price_per_km === null || row.price_per_km === undefined
        ? null
        : Number(row.price_per_km),
    status: ESTADOS.includes(status as RutaTransporte["status"])
      ? (status as RutaTransporte["status"])
      : "available",
    takenBy: row.taken_by ? String(row.taken_by) : null,
    takenAt: row.taken_at ? String(row.taken_at) : null,
  };
}

/** Carga las rutas de transporte desde Supabase. Sin conexión o con error devuelve []. */
export async function cargarRutas(): Promise<RutaTransporte[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("transport_routes")
      .select("*")
      .order("available_date", { ascending: true })
      .order("id", { ascending: true });
    if (error || !data) return [];
    return (data as unknown as FilaRuta[]).map(rutaFromRow);
  } catch {
    return [];
  }
}

/** Reserva una ruta en la base de datos para el transportista indicado. */
export async function tomarRuta(
  id: number,
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, message: "Supabase todavía no está configurado." };

  const { data, error } = await supabase
    .from("transport_routes")
    .update({
      status: "reserved",
      taken_by: userId,
      taken_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, status, taken_by");
  if (error) return { ok: false, message: error.message };

  const filas = (data ?? []) as unknown as FilaRuta[];
  if (filas.length > 0) {
    return { ok: true, message: "Ruta tomada: quedó reservada a tu nombre en la base." };
  }

  // No se actualizó ninguna fila: RLS la bloqueó o el id no existe.
  const { data: fila } = await supabase
    .from("transport_routes")
    .select("id, status, taken_by")
    .eq("id", id)
    .maybeSingle();
  if (!fila) return { ok: false, message: "La ruta no existe en la base de datos." };
  const vista = fila as unknown as FilaRuta;
  if (String(vista.status) === "reserved" && String(vista.taken_by ?? "") !== userId) {
    return { ok: false, message: "La ruta ya fue tomada por otro transportista." };
  }
  return { ok: false, message: "No pudimos guardar la ruta. Probá de nuevo en unos segundos." };
}
