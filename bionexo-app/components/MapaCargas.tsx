"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSONSource, LngLatBounds, Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  CAPACIDAD, CIUDADES, COMBOS, NOMBRES, TRAMO_META,
  distKm, etiquetaCorta, type Combo, type Tramo,
} from "@/lib/rutas";
import { cargarRutas, tomarRuta, type RutaTransporte } from "@/lib/routes";
import { useStore } from "@/lib/store";

type Coords = [number, number][];

interface TramoInfo {
  tipo: Tramo;
  coords: Coords;
  km: number;
  minutos: number;
}

interface Toast {
  texto: string;
  ok: boolean;
}

const cache = new Map<string, { coords: Coords; km: number; minutos: number }>();

function directo(a: string, b: string) {
  return { coords: [CIUDADES[a], CIUDADES[b]] as Coords, km: distKm(a, b), minutos: 0 };
}

/** Geometría real por calles vía OSRM (demo público). Cachea y cae a línea recta si falla. */
async function porCalles(a: string, b: string) {
  const key = `${a}>${b}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const base = directo(a, b);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${CIUDADES[a][0]},${CIUDADES[a][1]};${CIUDADES[b][0]},${CIUDADES[b][1]}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    const json = (await res.json()) as {
      routes?: { distance?: number; duration?: number; geometry?: { coordinates?: Coords } }[];
    };
    const r = json.routes?.[0];
    const coords = r?.geometry?.coordinates;
    if (coords && coords.length > 1) {
      const out = {
        coords,
        km: Math.round(r?.distance ? r.distance / 1000 : base.km),
        minutos: Math.round((r?.duration ?? 0) / 60),
      };
      cache.set(key, out);
      return out;
    }
  } catch {
    /* sin red o rate limit → línea recta */
  }
  return base;
}

function hhmm(min: number): string {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

export default function MapaCargas() {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const { user, role } = useStore();

  const [sel, setSel] = useState<Combo>(COMBOS[0]);
  const [ok, setOk] = useState(false);
  const [tramos, setTramos] = useState<TramoInfo[]>([]);
  const [trazando, setTrazando] = useState(true);
  const [foco, setFoco] = useState<number | null>(null);
  const [rutas, setRutas] = useState<RutaTransporte[]>([]);
  const [estado, setEstado] = useState<"idle" | "tomando" | "listo">("idle");
  const [toast, setToast] = useState<Toast | null>(null);

  const esTransportista = role === "transportista" || user?.role === "transportista";

  useEffect(() => {
    void cargarRutas().then(setRutas);
  }, []);

  useEffect(() => {
    if (!el.current) return;
    const m = new MapLibreMap({
      container: el.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [-58.4, -27.6],
      zoom: 6.4,
      attributionControl: { compact: true },
    });
    m.addControl(new NavigationControl({ showCompass: false, visualizePitch: false }), "bottom-right");
    m.on("load", () => {
      m.addSource("ruta", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      m.addLayer({
        id: "ruta-sombra",
        type: "line",
        source: "ruta",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": ["case", ["==", ["get", "foco"], 1], 1, 0.25],
          "line-width": ["+", ["get", "ancho"], 4],
        },
      });
      m.addLayer({
        id: "ruta-base",
        type: "line",
        source: "ruta",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-opacity": ["case", ["==", ["get", "foco"], 1], 1, 0.35],
          "line-width": ["get", "ancho"],
          "line-dasharray": ["case", ["==", ["get", "tipo"], "vacio"], ["literal", [0.6, 2]], ["literal", [1, 0]]],
        },
      });
      setOk(true);
    });
    map.current = m;
    return () => m.remove();
  }, []);

  // Traza: primero línea recta (respuesta instantánea) y luego geometría real.
  useEffect(() => {
    if (!ok) return;
    let cancelado = false;
    const timer = window.setTimeout(() => {
      setTrazando(true);
      setFoco(null);
      setEstado("idle");
      setToast(null);
      setTramos(sel.tramos.map(([a, b, tipo]) => ({ tipo, ...directo(a, b) })));
      void Promise.all(sel.tramos.map(async ([a, b, tipo]): Promise<TramoInfo> => ({ tipo, ...(await porCalles(a, b)) })))
        .then((finales) => {
          if (!cancelado) setTramos(finales);
        })
        .finally(() => {
          if (!cancelado) setTrazando(false);
        });
    }, 0);
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [sel, ok]);

  // Dibuja tramos + marcadores con nombre + encuadre.
  useEffect(() => {
    const m = map.current;
    if (!m || !ok || tramos.length === 0) return;

    (m.getSource("ruta") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: tramos.map((t, i) => ({
        type: "Feature" as const,
        properties: {
          tipo: t.tipo,
          color: TRAMO_META[t.tipo].color,
          ancho: TRAMO_META[t.tipo].ancho,
          foco: foco === i ? 1 : 0,
        },
        geometry: { type: "LineString" as const, coordinates: t.coords },
      })),
    });

    markers.current.forEach((x) => x.remove());
    markers.current = [];
    const unicas = sel.paradas.filter((p, i) => !(i === sel.paradas.length - 1 && p === sel.paradas[0]));
    unicas.forEach((p, i) => {
      const wrap = document.createElement("div");
      wrap.className = "flex flex-col items-center gap-1";
      const pin = document.createElement("div");
      pin.className =
        "grid h-8 w-8 place-items-center rounded-full border-[3px] border-white text-xs font-bold text-white shadow-lg " +
        (i === 0 ? "bg-slate-800" : "bg-green-600");
      pin.textContent = i === 0 ? "B" : String(i);
      const lab = document.createElement("span");
      lab.className =
        "whitespace-nowrap rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200";
      lab.textContent = etiquetaCorta(p);
      wrap.append(pin, lab);
      markers.current.push(new Marker({ element: wrap }).setLngLat(CIUDADES[p]).addTo(m));
    });

    const b = new LngLatBounds();
    unicas.forEach((p) => b.extend(CIUDADES[p]));
    const desktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    m.fitBounds(b, {
      padding: desktop ? { top: 90, bottom: 90, left: 90, right: 460 } : { top: 70, bottom: 380, left: 70, right: 70 },
      duration: 900,
      maxZoom: 9,
    });
  }, [tramos, ok, sel, foco]);

  const kpis = useMemo(() => {
    const kmReal = tramos.reduce((s, t) => s + t.km, 0);
    const minReal = tramos.reduce((s, t) => s + t.minutos, 0);
    const vacios = tramos.filter((t) => t.tipo === "vacio").reduce((s, t) => s + t.km, 0);
    const km = kmReal || sel.km;
    return {
      km,
      vacios: vacios || Math.round(sel.km * 0.35),
      tiempo: minReal ? hhmm(minReal) : sel.horas,
      porKm: (sel.usd / km).toFixed(2),
      ocupacion: Math.min(100, Math.round((sel.toneladas / CAPACIDAD) * 100)),
    };
  }, [tramos, sel]);

  async function aceptar() {
    if (estado !== "idle") return;
    if (!user || !esTransportista) {
      setToast({ texto: "Ingresá como transportista para aceptar rutas.", ok: false });
      return;
    }
    const [a, b] = sel.tramos[0] ?? [];
    const candidata =
      rutas.find((r) => r.originCity === NOMBRES[a ?? ""] && r.destinationCity === NOMBRES[b ?? ""]) ??
      rutas.find((r) => r.originCity === NOMBRES[a ?? ""]);

    setEstado("tomando");
    if (candidata && candidata.status === "available") {
      const res = await tomarRuta(candidata.id, user.id);
      if (res.ok) {
        setRutas((prev) =>
          prev.map((r) =>
            r.id === candidata.id
              ? { ...r, status: "reserved", takenBy: user.id, takenAt: new Date().toISOString() }
              : r,
          ),
        );
        setEstado("listo");
        setToast({ texto: `Ruta reservada en la base: ${sel.nombre}.`, ok: true });
      } else {
        setEstado("idle");
        setToast({ texto: `DATO SIMULADO · ${res.message}`, ok: false });
      }
    } else if (candidata && candidata.status === "reserved") {
      setEstado("idle");
      setToast({ texto: "Esa ruta ya fue tomada por otro transportista.", ok: false });
    } else {
      await new Promise((r) => setTimeout(r, 550));
      setEstado("listo");
      setToast({ texto: `DATO SIMULADO · Ruta aceptada: ${sel.nombre} · ${sel.detalle}.`, ok: true });
    }
  }

  return (
    <div className="relative h-[calc(100dvh-172px)] min-h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div ref={el} className="absolute inset-0" />

      {trazando && (
        <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-lg">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Trazando por calles con OSRM…
        </div>
      )}

      {/* Leyenda */}
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur">
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tramos</span>
        {(Object.keys(TRAMO_META) as Tramo[]).map((t) => (
          <span key={t} className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
            <span className="inline-block h-1.5 w-7 rounded-full" style={{ background: TRAMO_META[t].color }} />
            {TRAMO_META[t].label}
          </span>
        ))}
        <span className="mt-1 border-t border-slate-200 pt-1.5 text-[10px] text-slate-400">
          Base = Resistencia · camión {CAPACIDAD} t
        </span>
      </div>

      <aside className="absolute bottom-0 left-0 right-0 z-20 max-h-[62dvh] overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl lg:bottom-4 lg:left-auto lg:right-4 lg:top-4 lg:max-h-none lg:w-[400px] lg:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-green-950">Combinaciones de ruta</h1>
            <p className="text-xs text-slate-500">Elegí una combinación y seguí el recorrido</p>
          </div>
          {estado === "listo" && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">✓ ACEPTADA</span>}
        </div>

        {/* KPIs de la ruta elegida */}
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[
            ["US$/km", kpis.porKm],
            ["Distancia", `${kpis.km} km`],
            ["Vacío", `${kpis.vacios} km`],
            ["Tiempo", kpis.tiempo],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 px-2 py-1.5 text-center ring-1 ring-slate-200">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{k}</div>
              <div className="text-[13px] font-extrabold text-slate-800">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-2.5">
          {COMBOS.map((c) => {
            const activo = sel.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSel(c)}
                aria-pressed={activo}
                className={`w-full rounded-2xl border-2 p-3 text-left transition ${
                  activo ? "border-emerald-600 bg-emerald-50/70 shadow-sm" : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="text-sm text-slate-900">{c.nombre}</b>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{c.etiqueta}</span>
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <span className="text-2xl font-extrabold leading-none text-emerald-600">US$ {c.usd}</span>
                  <span className="text-right text-[11px] text-slate-500">
                    {(c.usd / c.km).toFixed(2)} US$/km<br />
                    {c.km} km · {c.horas}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{c.detalle}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                    style={{ width: `${Math.min(100, (c.toneladas / CAPACIDAD) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-[10px] font-semibold text-slate-400">
                  Ocupación {Math.min(100, Math.round((c.toneladas / CAPACIDAD) * 100))}% · {c.paradas.length - 1} paradas
                </div>
              </button>
            );
          })}
        </div>

        {/* Timeline de tramos: hover para aislar en el mapa */}
        <div className="mt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Recorrido</h2>
          <ol className="space-y-1">
            {tramos.map((t, i) => {
              const meta = TRAMO_META[t.tipo];
              const [a, b] = sel.tramos[i] ?? [];
              return (
                <li
                  key={i}
                  onMouseEnter={() => setFoco(i)}
                  onMouseLeave={() => setFoco(null)}
                  className={`flex cursor-default items-center gap-2.5 rounded-xl px-2 py-1.5 text-xs transition ${
                    foco === i ? "bg-slate-100" : "bg-transparent"
                  }`}
                >
                  <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: meta.color }} />
                  <span className="w-16 shrink-0 font-semibold text-slate-800">{etiquetaCorta(a ?? "")}</span>
                  <span className="text-slate-400">→</span>
                  <span className="w-20 shrink-0 font-semibold text-slate-800">{etiquetaCorta(b ?? "")}</span>
                  <span className="ml-auto shrink-0 text-slate-500">
                    {t.km} km{t.minutos ? ` · ${hhmm(t.minutos)}` : ""}
                  </span>
                  <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${meta.color}1f`, color: meta.color }}>
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {toast && (
          <p
            role="status"
            className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold"
            style={{
              background: toast.ok ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${toast.ok ? "#bbf7d0" : "#fecaca"}`,
              color: toast.ok ? "#166534" : "#991b1b",
            }}
          >
            {toast.texto}
          </p>
        )}

        <button
          type="button"
          onClick={() => void aceptar()}
          disabled={estado !== "idle"}
          className="mt-3 w-full rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-500 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
        >
          {estado === "tomando" ? "Aceptando…" : estado === "listo" ? "Ruta aceptada ✓" : "Aceptar esta ruta"}
        </button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Combos de demo · calles por OSRM · reserva contra tu base Supabase
        </p>
      </aside>
    </div>
  );
}
